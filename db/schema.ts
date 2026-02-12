import { bigint, boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
    id: uuid('id').defaultRandom().primaryKey(),
    partnerCode: text('partner_code').notNull().unique(),
    name: text('name'),
    partnerId: uuid('partner_id'),
    partnerName: text('partner_name'),
    anniversary: bigint('anniversary', { mode: 'number' }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    type: text('type', { enum: ['text', 'drawing', 'collage'] }).notNull(),
    content: text('content').notNull(),
    color: text('color'),
    images: jsonb('images').$type<string[]>(),
    pinned: boolean('pinned').default(false),
    bookmarked: boolean('bookmarked').default(false),
    timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    text: text('text').notNull(),
    completed: boolean('completed').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});
