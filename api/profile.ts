import { eq } from 'drizzle-orm';
import { db } from '../db';
import { profiles } from '../db/schema';

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
        if (req.method === 'POST') {
            const { name } = req.body;
            const partnerCode = Math.random().toString(36).substr(2, 6).toUpperCase();

            const [newProfile] = await db.insert(profiles).values({
                name,
                partnerCode,
            }).returning();

            return res.status(200).json(newProfile);
        }

        if (req.method === 'GET') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Profile ID required' });
            }

            const profile = await db.query.profiles.findFirst({
                where: eq(profiles.id, id),
            });

            if (!profile) {
                return res.status(404).json({ error: 'Profile not found' });
            }

            return res.status(200).json(profile);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
