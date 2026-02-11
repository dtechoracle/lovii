import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { notes } from '../db/schema';

export default async function handler(req: any, res: any) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            const { profileId, partnerId } = req.query;

            if (!profileId) {
                return res.status(400).json({ error: 'Profile ID required' });
            }

            const targetId = partnerId || profileId;

            const result = await db.query.notes.findMany({
                where: eq(notes.profileId, targetId),
                orderBy: [desc(notes.timestamp)],
            });

            return res.status(200).json(result);
        }

        if (req.method === 'POST') {
            const body = req.body;
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

            return res.status(200).json(newNote);
        }

        if (req.method === 'PATCH') {
            const body = req.body;
            const { id, ...updates } = body;

            if (!id) return res.status(400).json({ error: 'ID required' });

            const [updated] = await db.update(notes)
                .set(updates)
                .where(eq(notes.id, id))
                .returning();

            return res.status(200).json(updated);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
