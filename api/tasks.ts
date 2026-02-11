import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { tasks } from '../db/schema';

export default async function handler(req: any, res: any) {
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
            const { profileId } = req.query;

            if (!profileId) {
                return res.status(400).json({ error: 'Profile ID required' });
            }

            const result = await db.query.tasks.findMany({
                where: eq(tasks.profileId, profileId),
                orderBy: [desc(tasks.createdAt)],
            });

            return res.status(200).json(result);
        }

        if (req.method === 'POST') {
            const body = req.body;

            if (Array.isArray(body)) {
                // Bulk replace
                const profileId = body[0]?.profileId;
                if (profileId) {
                    await db.delete(tasks).where(eq(tasks.profileId, profileId));
                    if (body.length > 0) {
                        await db.insert(tasks).values(body);
                    }
                }
                return res.status(200).json({ success: true });
            }

            const [newTask] = await db.insert(tasks).values({
                profileId: body.profileId,
                text: body.text,
                completed: body.completed || false,
            }).returning();

            return res.status(200).json(newTask);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
