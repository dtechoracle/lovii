import { db } from '@/db';
import { connections, users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function POST(request: Request) {
    return Response.json({ error: 'Use /api/auth/register to create account' }, { status: 400 });
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, avatar } = body;

        if (!id) {
            return Response.json({ error: 'ID required' }, { status: 400 });
        }

        // Update User
        const [updatedUser] = await db.update(users)
            .set({
                name,
                avatar
            })
            .where(eq(users.id, id))
            .returning();

        if (!updatedUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        return Response.json({
            id: updatedUser.id,
            name: updatedUser.name,
            code: updatedUser.code,
            avatar: updatedUser.avatar
        });
    } catch (error) {
        console.error('PUT profile error:', error);
        return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return Response.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        // Get User
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
        });

        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Get Connections to find partner info
        // We look for any connection where this user is A or B
        const connection = await db.query.connections.findFirst({
            where: or(
                eq(connections.userA, id),
                eq(connections.userB, id)
            )
        });

        let partnerInfo = {};
        if (connection) {
            const partnerId = connection.userA === id ? connection.userB : connection.userA;
            const partner = await db.query.users.findFirst({
                where: eq(users.id, partnerId)
            });
            if (partner) {
                partnerInfo = {
                    partnerId: partner.id,
                    partnerName: partner.name,
                    partnerCode: partner.code,
                    connectedAt: connection.createdAt
                };
            }
        }

        return Response.json({
            id: user.id,
            name: user.name,
            code: user.code,
            avatar: user.avatar,
            ...partnerInfo
        });

    } catch (error) {
        console.error('GET profile error:', error);
        return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
