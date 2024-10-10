import express from 'express';
import { getUsers } from '../db/users';

export const getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const result = await getUsers(limit, offset);

        return res.status(200).json(result);
    } catch (e) {
        console.log(e);
        return res.sendStatus(400);
    }
};
