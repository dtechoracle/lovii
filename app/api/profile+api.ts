import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const partnerCode = Math.random().toString(36).substr(2, 6).toUpperCase();

        const [newProfile] = await db.insert(profiles).values({
            name,
            partnerCode,
        }).returning();

        return Response.json(newProfile);
    } catch (error) {
        return Response.json({ error: 'Failed to create profile' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        let { id, name, partnerCode } = body;

        if (!id) {
            return Response.json({ error: 'ID required' }, { status: 400 });
        }

        // SANITIZE: Ensure ID is a valid UUID. If not, generate one.
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            console.log('[API] Check: Invalid UUID format received:', id);
            id = crypto.randomUUID();
            console.log('[API] Generated new UUID:', id);
        }

        // Upsert: Try insert, on conflict update
        const [profile] = await db.insert(profiles).values({
            id,
            name,
            partnerCode,
            // maintain other fields if sent
            partnerId: body.partnerId,
            partnerName: body.partnerName,
            anniversary: body.anniversary
        })
            .onConflictDoUpdate({
                target: profiles.id,
                set: {
                    name,
                    partnerCode,
                    partnerId: body.partnerId,
                    partnerName: body.partnerName,
                    anniversary: body.anniversary
                }
            })
            .returning();

        return Response.json(profile);
    } catch (error) {
        console.error('PUT profile error:', error);
        return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const profileId = url.searchParams.get('id');

    if (!profileId) {
        return Response.json({ error: 'Profile ID required' }, { status: 400 });
    }

    try {
        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.id, profileId),
        });

        if (!profile) {
            return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        return Response.json(profile);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
