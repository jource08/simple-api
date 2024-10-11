import express from 'express';
import { createUser, getUserByEmail, updateUserById } from '../db/users';
import { authentication, random } from '../helpers';
import { DOMAIN, SESSION_TOKEN } from '../constants';

// Temporary in-memory OTP store
let otpMemoryStore: { [key: string]: string } = {}; // Stores OTP for each email

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

export const forgotPassword = async (req: express.Request, res: express.Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if the user exists
        const user = await getUserByEmail(email);
        if (!user || user.length === 0) {
            return res.status(400).json({ message: 'User not found with that email' });
        }

        // Generate a random 6-digit OTP
        const otp = generateOtp(); // Generate the OTP
        otpMemoryStore[email] = otp; // Store OTP in memory

        console.log(`OTP for ${email}: ${otp}`); // Log OTP for debugging (you would send this in an email in a real implementation)

        // Send OTP as part of the response for now
        return res.status(200).json({ demo_otp: otp }); // Send only OTP (numeric value)
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
};

// Generate a 6-digit numeric OTP
const generateOtp = (): string => {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a number between 100000 and 999999
    return otp.toString();
};

export const resetPassword = async (req: express.Request, res: express.Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        // Check if OTP exists for the provided email in memory
        if (otpMemoryStore[email] !== otp) {
            return res.status(400).json({ message: 'Invalid OTP or OTP expired' });
        }

        // Check if the user exists
        const user = await getUserByEmail(email);
        if (!user || user.length === 0) {
            return res.status(400).json({ message: 'User not found with that email' });
        }

        const updatedUser = user[0];

        // Check if the new password is the same as the current password
        const expectedHash = authentication(updatedUser.salt, newPassword);
        if (updatedUser.password === expectedHash) {
            return res.status(400).json({ message: 'New password cannot be the same as the old password' });
        }

        // Update the password
        const salt = random(); // Generate new salt
        updatedUser.password = authentication(salt, newPassword); // Hash the new password with salt
        updatedUser.salt = salt;

        // Update user with the new password
        const result = await updateUserById(updatedUser.id, updatedUser);

        // Remove OTP from memory after successful password reset
        delete otpMemoryStore[email];

        return res.status(200).json({ message: 'Password reset successfully', data: result });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
};
