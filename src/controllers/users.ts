import express from 'express';
import { getUsers, updateUserById } from '../db/users';

export const getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const result = await getUsers(limit, offset);

        return res.status(200).json(result);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'An error occurred while fetching users.' });
    }
};

export const updateUser = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const { username, fullname, bio, profile_image_url } = req.body;

        if (!username && !fullname && !bio && !profile_image_url) {
            return res.status(400).json({ message: 'At least one field (username,fullname, bio, or profile_image_url) is required for update.' });
        }

        const updatedUser = {
            username,
            fullname,
            bio,
            profile_image_url,
        };

        const result = await updateUserById(parseInt(id, 10), updatedUser);

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while updating the user.' });
    }
};