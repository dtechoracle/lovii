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
