import { db } from '@/db';
import { tasks } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const profileId = url.searchParams.get('profileId');

    if (!profileId) {
        return Response.json({ error: 'Profile ID required' }, { status: 400 });
    }

    try {
        const result = await db.query.tasks.findMany({
            where: eq(tasks.profileId, profileId),
            orderBy: [desc(tasks.createdAt)],
        });

        return Response.json(result);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Check if it's a delete request (simple way, or use DELETE method)
        // Let's stick to REST: POST for create. But wait, `saveTasks` in storage wiped everything.
        // Let's support bulk insert for now to match old behavior, OR single insert.
        // The old behavior was: delete all, insert new.

        // If body is array, it's a full sync/replace? Or just insert?
        // Let's implement single create for now.

        if (Array.isArray(body)) {
            // Bulk replace logic if needed
            // Not typical for REST, usually DELETE /api/tasks?profileId=... then POST many
            // Let's assume standard single item creation for now, unless storage service needs bulk.
            // Looking at storage service: saveTasks takes an array.

            const profileId = body[0]?.profileId;
            if (profileId) {
                await db.delete(tasks).where(eq(tasks.profileId, profileId));
                if (body.length > 0) {
                    await db.insert(tasks).values(body);
                }
            }
            return Response.json({ success: true });
        }

        const [newTask] = await db.insert(tasks).values({
            profileId: body.profileId,
            text: body.text,
            completed: body.completed || false,
        }).returning();

        return Response.json(newTask);
    } catch (error) {
        return Response.json({ error: 'Failed to save task' }, { status: 500 });
    }
}
