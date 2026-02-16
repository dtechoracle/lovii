import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { myId, partnerCode } = await request.json();

        // Find partner
        const partner = await db.query.profiles.findFirst({
            where: eq(profiles.partnerCode, partnerCode),
        });

        if (!partner) {
            return Response.json({ error: 'Partner not found' }, { status: 404 });
        }

        // Link me to partner
        const [myUpdate] = await db.update(profiles)
            .set({ partnerId: partner.id })
            .where(eq(profiles.id, myId))
            .returning();

        if (!myUpdate) {
            return Response.json({ error: 'Your profile not found. Please save changes first.' }, { status: 404 });
        }

        // Link partner to me
        await db.update(profiles)
            .set({ partnerId: myId })
            .where(eq(profiles.id, partner.id));

        return Response.json({ success: true, partnerId: partner.id, partnerName: partner.name });
    } catch (error) {
        return Response.json({ error: 'Connection failed' }, { status: 500 });
    }
}
