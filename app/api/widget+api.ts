import { db } from "@/db";
import { connections, notes, users } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";

// Send a note to partner's widget
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { myId, note } = body;

    if (!myId || !note) {
      return Response.json(
        { error: "Missing required fields: myId, note" },
        { status: 400 }
      );
    }

    // 1. Verify User exists
    const me = await db.query.users.findFirst({
      where: eq(users.id, myId)
    });
    if (!me) return Response.json({ error: "User not found" }, { status: 404 });

    // 2. Find Connection
    const connection = await db.query.connections.findFirst({
      where: or(
        eq(connections.userA, myId),
        eq(connections.userB, myId)
      )
    });

    if (!connection) {
      return Response.json({ error: "No partner connected" }, { status: 400 });
    }

    const partnerId = connection.userA === myId ? connection.userB : connection.userA;
    const partner = await db.query.users.findFirst({
      where: eq(users.id, partnerId)
    });

    if (!partner) {
      return Response.json({ error: "Partner not found in database" }, { status: 404 });
    }

    // 3. Save the note to my account (author = me)
    const [savedNote] = await db
      .insert(notes)
      .values({
        userId: myId,  // Author is ME
        type: note.type,
        content: note.content,
        color: note.color,
        images: note.images,
        timestamp: note.timestamp,
        pinned: note.pinned || false,
        bookmarked: note.bookmarked || false,
      })
      .returning();

    // 4. Fetch partner's latest note (author = partner)
    const partnerLatestNote = await db.query.notes.findFirst({
      where: eq(notes.userId, partnerId),
      orderBy: [desc(notes.timestamp)],
    });

    // 5. Return success with partner info
    return Response.json({
      success: true,
      note: savedNote,
      partner: {
        id: partner.id,
        name: partner.name,
        code: partner.code,
        connected: true,
      },
      partnerWidget: {
        hasNote: !!partnerLatestNote,
        lastNote: partnerLatestNote
          ? {
            type: partnerLatestNote.type,
            content: partnerLatestNote.content,
            timestamp: partnerLatestNote.timestamp,
            color: partnerLatestNote.color,
          }
          : null,
      },
    });
  } catch (error) {
    console.error("[Widget API] Error:", error);
    return Response.json(
      { error: "Failed to send note to partner widget" },
      { status: 500 }
    );
  }
}

// Get partner's widget status
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const myId = url.searchParams.get("myId");

    if (!myId) {
      return Response.json({ error: "myId required" }, { status: 400 });
    }

    // 1. Find Connection
    const connection = await db.query.connections.findFirst({
      where: or(
        eq(connections.userA, myId),
        eq(connections.userB, myId)
      )
    });

    if (!connection) {
      return Response.json({
        connected: false,
        partner: null,
        widget: null,
      });
    }

    const partnerId = connection.userA === myId ? connection.userB : connection.userA;
    const partner = await db.query.users.findFirst({
      where: eq(users.id, partnerId)
    });

    if (!partner) {
      return Response.json({
        connected: false,
        partner: null,
        widget: null,
      });
    }

    // 2. Get partner's latest note
    const partnerLatestNote = await db.query.notes.findFirst({
      where: eq(notes.userId, partnerId),
      orderBy: [desc(notes.timestamp)],
    });

    return Response.json({
      connected: true,
      partner: {
        id: partner.id,
        name: partner.name,
        code: partner.code,
      },
      widget: {
        hasNote: !!partnerLatestNote,
        lastNote: partnerLatestNote
          ? {
            type: partnerLatestNote.type,
            content: partnerLatestNote.content,
            timestamp: partnerLatestNote.timestamp,
            color: partnerLatestNote.color,
          }
          : null,
      },
    });
  } catch (error) {
    console.error("[Widget API GET] Error:", error);
    return Response.json(
      { error: "Failed to fetch partner widget status" },
      { status: 500 }
    );
  }
}
