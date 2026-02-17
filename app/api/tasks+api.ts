import { db } from '@/db';
import { tasks } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('profileId') || url.searchParams.get('userId');

    if (!userId) {
        return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        const result = await db.query.tasks.findMany({
            where: eq(tasks.userId, userId),
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

        // Support bulk replacement (legacy behavior for tasks sync)
        if (Array.isArray(body)) {
            const userId = body[0]?.profileId || body[0]?.userId;
            if (userId) {
                // Delete existing tasks for user
                await db.delete(tasks).where(eq(tasks.userId, userId));

                if (body.length > 0) {
                    // Map items to match schema (profileId -> userId)
                    const newTasks = body.map(t => ({
                        userId: t.profileId || t.userId,
                        text: t.text,
                        completed: t.completed
                    }));
                    await db.insert(tasks).values(newTasks);
                }
            }
            return Response.json({ success: true });
        }

        const userId = body.profileId || body.userId;
        const [newTask] = await db.insert(tasks).values({
            userId: userId,
            text: body.text,
            completed: body.completed || false,
        }).returning();

        return Response.json(newTask);
    } catch (error) {
        console.error('POST task error:', error);
        return Response.json({ error: 'Failed to save task' }, { status: 500 });
    }
}
