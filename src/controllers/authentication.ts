import express from 'express';
import { createUser, getUserByEmail, updateUserById } from '../db/users';
import { authentication, random } from '../helpers';
import { DOMAIN, SESSION_TOKEN } from '../constants';

export const register = async (req: express.Request, res: express.Response) => {
    try {
        const { username, email, password, fullname, bio, profile_image_url } = req.body;

        if (!username || !email || !password) {
            return res.sendStatus(400);
        }

        const result = await getUserByEmail(email);

        if (!result || result.length > 0) {
            return res.sendStatus(400);
        }

        const salt = random();
        const user = await createUser({
            username,
            email,
            fullname,
            bio,
            profile_image_url,
            salt,
            password: authentication(salt, password),
        });

        return res.status(200).json(user).end();
    } catch (e) {
        console.log(e);
        return res.sendStatus(400);
    }
};

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Get user by email
        const result = await getUserByEmail(email);

        // If no user is found
        if (!result || result.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = result[0];

        // Verify the password
        const expectedHash = authentication(user.salt, password);
        if (user.password !== expectedHash) {
            return res.status(403).json({ message: 'Invalid email or password' });
        }

        // Generate a new session token
        user.sessiontoken = authentication(random(), user.password);

        // Update user with the new session token
        const updatedUser = await updateUserById(user.id, user);

        // Set the session token in the cookie
        res.cookie(SESSION_TOKEN, user.sessiontoken, {
            domain: DOMAIN,
            path: '/',
            expires: new Date(Date.now() + 900000), // 15 minutes
        });

        // Return the updated user info
        return res.status(200).json({ message: 'Login successful', data: updatedUser }).end();
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
};
