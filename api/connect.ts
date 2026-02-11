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
            const { myId, partnerCode } = req.body;

            // Find partner
            const partner = await db.query.profiles.findFirst({
                where: eq(profiles.partnerCode, partnerCode),
            });

            if (!partner) {
                return res.status(404).json({ error: 'Partner not found' });
            }

            // Link me to partner
            await db.update(profiles)
                .set({ partnerId: partner.id })
                .where(eq(profiles.id, myId));

            // Link partner to me
            await db.update(profiles)
                .set({ partnerId: myId })
                .where(eq(profiles.id, partner.id));

            return res.status(200).json({ success: true, partnerId: partner.id, partnerName: partner.name });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
