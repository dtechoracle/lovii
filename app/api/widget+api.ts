import { db } from "@/db";
import { notes, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    // 1. Fetch my profile to get partnerId
    const myProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, myId),
    });

    if (!myProfile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!myProfile.partnerId) {
      return Response.json(
        {
          error: "No partner connected",
          connected: false,
        },
        { status: 400 }
      );
    }

    // 2. Verify partner exists in database
    const partnerProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, myProfile.partnerId),
    });

    if (!partnerProfile) {
      return Response.json(
        {
          error: "Partner profile not found in database",
          connected: false,
        },
        { status: 404 }
      );
    }

    // 3. Save the note to my account (so partner can see it)
    const [savedNote] = await db
      .insert(notes)
      .values({
        profileId: myId,
        type: note.type,
        content: note.content,
        color: note.color,
        images: note.images,
        timestamp: note.timestamp,
        pinned: note.pinned || false,
        bookmarked: note.bookmarked || false,
      })
      .returning();

    // 4. Fetch partner's current widget status (their latest note to me)
    const partnerLatestNote = await db.query.notes.findFirst({
      where: eq(notes.profileId, myProfile.partnerId),
      orderBy: (notes, { desc }) => [desc(notes.timestamp)],
    });

    // 5. Return success with partner info
    return Response.json({
      success: true,
      note: savedNote,
      partner: {
        id: partnerProfile.id,
        name: partnerProfile.name,
        code: partnerProfile.partnerCode,
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

    // 1. Get my profile
    const myProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, myId),
    });

    if (!myProfile || !myProfile.partnerId) {
      return Response.json({
        connected: false,
        partner: null,
        widget: null,
      });
    }

    // 2. Get partner profile
    const partnerProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, myProfile.partnerId),
    });

    if (!partnerProfile) {
      return Response.json({
        connected: false,
        partner: null,
        widget: null,
      });
    }

    // 3. Get partner's latest note
    const partnerLatestNote = await db.query.notes.findFirst({
      where: eq(notes.profileId, myProfile.partnerId),
      orderBy: (notes, { desc }) => [desc(notes.timestamp)],
    });

    return Response.json({
      connected: true,
      partner: {
        id: partnerProfile.id,
        name: partnerProfile.name,
        code: partnerProfile.partnerCode,
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
