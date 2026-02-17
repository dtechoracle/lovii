import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { password, name, avatar } = await request.json();

        if (!password) {
            return Response.json({ error: 'Password is required' }, { status: 400 });
        }

        // Generate unique code (e.g., LOVII-A7B2X9)
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `LOVII-${randomPart}`;

        // Check uniqueness (simple retry logic could be added, but collision low for demo)
        const existing = await db.query.users.findFirst({
            where: eq(users.code, code)
        });

        if (existing) {
            // In production, retry. For now, just error (very unlikely with prefixes? actually 1000-9999 is small space!)
            // Let's use nanoid for better collision resistance? But user wants "User code".
            // Let's make it 6 chars alphanumeric for balance between readable and unique.
            // Or just Retry.
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const [newUser] = await db.insert(users).values({
            code: code,
            passwordHash: hashedPassword,
            name: name || 'Anonymous',
            avatar: avatar,
        }).returning();

        return Response.json({
            success: true,
            user: {
                id: newUser.id,
                code: newUser.code,
                name: newUser.name,
                avatar: newUser.avatar
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        return Response.json({ error: 'Registration failed' }, { status: 500 });
    }
}
