import { db } from '@/db';
import { notes } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const profileId = url.searchParams.get('profileId');
    const partnerId = url.searchParams.get('partnerId');

    if (!profileId) {
        return Response.json({ error: 'Profile ID required' }, { status: 400 });
    }

    try {
        // Fetch user's own notes OR partner's notes if requested
        // Logic: 
        // - If fetching history (my notes + partner notes), normally we fetch both.
        // - For now, let's keep it simple: client requests specific target.

        // Actually, simplest is to fetch based on `profileId` being the AUTHOR of the note.
        // Client calls this twice: once for me, once for partner. Or we use OR.

        const targetId = partnerId || profileId; // If partnerId provided, fetch their notes.

        const result = await db.query.notes.findMany({
            where: eq(notes.profileId, targetId),
            orderBy: [desc(notes.timestamp)],
        });

        return Response.json(result);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const [newNote] = await db.insert(notes).values({
            profileId: body.profileId,
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
        console.error(error);
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
