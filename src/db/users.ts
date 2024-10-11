import { drizzle } from 'drizzle-orm/node-postgres';
import { InferModel, eq, sql,ilike, or } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    fullname: text('fullname').notNull(),
    bio: text('bio'),
    profile_image_url: text('profile_image_url'),
    salt: text('salt'),
    sessiontoken: text('sessiontoken'),
});

export type User = InferModel<typeof users>;
export type NewUser = InferModel<typeof users, 'insert'>;

const pool = new Pool({
    connectionString: process.env.DB,
});

const db = drizzle(pool);

export const getUsers = async (limit: number, offset: number, sortBy: string, sortDirection: 'ASC' | 'DESC'): Promise<any> => {
    try {
        const [result, totalCount] = await Promise.all([
            db
                .select({
                    id: users.id,
                    username: users.username,
                    email: users.email,
                    fullname: users.fullname,
                    bio: users.bio,
                    profile_image_url: users.profile_image_url,
                })
                .from(users)
                .orderBy(sql.raw(`${sortBy} ${sortDirection}`))
                .limit(limit)
                .offset(offset),
            db
                .select({ count: sql`count(${users.id})` })
                .from(users)
                .then(rows => rows[0].count),
        ]);

        const totalPages = Math.ceil(parseInt(totalCount.toString()) / limit);

        return {
            data: result,
            currentPage: offset / limit + 1,
            totalPages,
            totalCount: parseInt(totalCount.toString()),
            limit,
        };
    } catch (e) {
        console.log(e);
        return {
            data: [],
            currentPage: 0,
            totalPages: 0,
            totalCount: 0,
            limit: 0,
        };
    }
};

export const searchUsers = async (searchTerm: string, limit: number, offset: number, sortBy: string, sortDirection: 'ASC' | 'DESC') => {
    try {
        const result = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                fullname: users.fullname,
                bio: users.bio,
                profile_image_url: users.profile_image_url,
            })
            .from(users)
            .where(
                or(
                    ilike(users.username, `%${searchTerm}%`),
                    ilike(users.email, `%${searchTerm}%`),
                    ilike(users.fullname, `%${searchTerm}%`)
                )
            )
            .orderBy(sql.raw(`${sortBy} ${sortDirection}`))
            .limit(limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql`count(${users.id})` })
            .from(users)
            .where(
                or(
                    ilike(users.username, `%${searchTerm}%`),
                    ilike(users.email, `%${searchTerm}%`),
                    ilike(users.fullname, `%${searchTerm}%`)
                )
            )
            .then(rows => rows[0].count);

        const totalPages = Math.ceil(parseInt(totalCount.toString()) / limit);

        return {
            data: result,
            currentPage: offset / limit + 1,
            totalPages,
            totalCount: parseInt(totalCount.toString()),
            limit,
        };
    } catch (error) {
        console.error(error);
        return {
            data: [],
            currentPage: 0,
            totalPages: 0,
            totalCount: 0,
            limit: 0,
        };
    }
};

export const getUserByEmail = async (email: string) =>
    await db.select().from(users).where(eq(users.email, email));

export const getUserBySessionToken = async (sessionToken: string) =>
    await db.select().from(users).where(eq(users.sessiontoken, sessionToken));

export const createUser = async (newUser: NewUser) =>
    await db
        .insert(users)
        .values(newUser)
        .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            fullname: users.fullname,
            bio: users.bio,
            profile_image_url: users.profile_image_url,
        });

export const updateUserById = async (id: number, updatedUser: Partial<User>) => {
    return await db
        .update(users)
        .set(updatedUser)
        .where(eq(users.id, id))
        .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            fullname: users.fullname,
            bio: users.bio,
            profile_image_url: users.profile_image_url,
        });
};