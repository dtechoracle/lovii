import { db } from '@/db';
import { connections, users } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { myId, partnerCode } = await request.json();

        if (!myId || !partnerCode) {
            return Response.json({ error: 'Missing ID or Partner Code' }, { status: 400 });
        }

        // 1. Find myself
        const me = await db.query.users.findFirst({
            where: eq(users.id, myId)
        });
        if (!me) return Response.json({ error: 'Your account not found' }, { status: 404 });

        // 2. Find partner
        const partner = await db.query.users.findFirst({
            where: eq(users.code, partnerCode),
        });

        if (!partner) {
            return Response.json({ error: 'Partner code not found' }, { status: 404 });
        }

        if (partner.id === myId) {
            return Response.json({ error: 'You cannot connect to yourself 💔' }, { status: 400 });
        }

        // 3. Check existing connection
        const existing = await db.query.connections.findFirst({
            where: or(
                and(eq(connections.userA, myId), eq(connections.userB, partner.id)),
                and(eq(connections.userA, partner.id), eq(connections.userB, myId))
            )
        });

        if (existing) {
            return Response.json({
                success: true,
                message: 'Already connected',
                partnerId: partner.id,
                partnerName: partner.name
            });
        }

        // 4. Create Connection
        await db.insert(connections).values({
            userA: myId,
            userB: partner.id,
            status: 'active' // Auto-accept for now? Or pending? User didn't specify. Active is easier.
        });

        return Response.json({
            success: true,
            partnerId: partner.id,
            partnerName: partner.name
        });

    } catch (error) {
        console.error('Connection error:', error);
        return Response.json({ error: 'Connection failed' }, { status: 500 });
    }
}
