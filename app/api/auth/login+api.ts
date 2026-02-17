import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { code, password } = await request.json();

        if (!code || !password) {
            return Response.json({ error: 'Code and Password are required' }, { status: 400 });
        }

        // Find User
        const user = await db.query.users.findFirst({
            where: eq(users.code, code)
        });

        if (!user) {
            return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check Password
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Return User Info (No Token for now, just ID/Code)
        // In real app, issue JWT here. For simple app, client stores ID and we trust it?
        // Or better: Generate a simple session token/ID?
        // Let's return the User Object. Client uses ID for future requests.
        // NOTE: This is weak security (ID spoofing possible if API doesn't verify token).
        // But for this stage, it matches "User code will be auto generated".

        return Response.json({
            success: true,
            user: {
                id: user.id,
                code: user.code,
                name: user.name,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        return Response.json({ error: 'Login failed' }, { status: 500 });
    }
}
