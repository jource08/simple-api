import express from 'express';
import { SESSION_TOKEN } from '../constants';
import { getUserBySessionToken } from '../db/users';

export const isAuthenticated = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
) => {
    try {
        const sessionToken = req.cookies[SESSION_TOKEN];

        if (!sessionToken) {
            return res.status(403).json({ message: 'No session token provided. Access denied.' });
        }

        const result = await getUserBySessionToken(sessionToken);

        if (!result || result.length === 0) {
            return res.status(403).json({ message: 'Invalid session token. Authentication failed.' });
        }

        return next();
    } catch (e) {
        console.error(e);
        return res.status(400).json({ message: 'An error occurred while validating session token.' });
    }
};
