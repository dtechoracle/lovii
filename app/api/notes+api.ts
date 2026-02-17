import { db } from '@/db';
import { notes } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('profileId') || url.searchParams.get('userId'); // Support both for now to ease transition? No, frontend will send profileId because StorageService uses it. Rename param?
    // StorageService sends `profileId=${profileId}`.
    // So we map `profileId` query param -> `userId` logic.

    // OR we change StorageService to send userId.
    // Let's assume input param name is legacy 'profileId' but maps to user ID.

    const targetId = userId;

    if (!targetId) {
        return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        const result = await db.query.notes.findMany({
            where: eq(notes.userId, targetId),
            orderBy: [desc(notes.timestamp)],
        });

        return Response.json(result);
    } catch (error) {
        console.error('GET notes error:', error);
        return Response.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Body has profileId. Map to userId.
        const userId = body.profileId || body.userId;

        const [newNote] = await db.insert(notes).values({
            userId: userId,
            type: body.type,
            content: body.content,
            color: body.color,
            images: body.images,
            timestamp: body.timestamp,
            pinned: body.pinned || false,
            bookmarked: body.bookmarked || false,
        }).returning();

        return Response.json(newNote);
    } catch (error) {
        console.error('POST note error:', error);
        return Response.json({ error: 'Failed to save note' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

        const [updated] = await db.update(notes)
            .set(updates)
            .where(eq(notes.id, id))
            .returning();

        return Response.json(updated);
    } catch (error) {
        return Response.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    try {
        await db.delete(notes).where(eq(notes.id, id));
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: 'Delete failed' }, { status: 500 });
    }
}
