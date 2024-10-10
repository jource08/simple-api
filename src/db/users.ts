import { drizzle } from 'drizzle-orm/node-postgres';
import { InferModel, eq, sql } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    salt: text('salt'),
    sessiontoken: text('sessiontoken'),
});

export type User = InferModel<typeof users>;
export type NewUser = InferModel<typeof users, 'insert'>;

const pool = new Pool({
    connectionString: process.env.DB,
});

const db = drizzle(pool);

export const getUsers = async (limit: number, offset: number): Promise<any> =>{
    try {
        const [result,totalCount] = await Promise.all([
            db.select({ id: users.id, username: users.username, email: users.email }).from(users).limit(limit).offset(offset),
            db.select({ count: sql`count(${users.id})` }).from(users).then(rows => rows[0].count)
        ]);

        const totalPages = Math.ceil(parseInt(totalCount.toString()) / limit);

        return {
            data: result,
            currentPage: offset / limit + 1,
            totalPages,
            limit
        }

    } catch (e) {
        console.log(e);
        return {
            data: [],
            currentPage: 0,
            totalPages: 0,
            limit: 0
        }
    }
}

export const getUserByEmail = async (email: string) =>
    await db.select().from(users).where(eq(users.email, email));
export const getUserBySessionToken = async (sessionToken: string) =>
    await db.select().from(users).where(eq(users.sessiontoken, sessionToken));
export const createUser = async (newUser: NewUser) =>
    await db
        .insert(users)
        .values(newUser)
        .returning({ id: users.id, username: users.username, email: users.email });
export const updateUserById = async (id: number, updatedUser: User) =>
    await db
        .update(users)
        .set(updatedUser)
        .where(eq(users.id, id))
        .returning({ id: users.id, username: users.username, email: users.email });
