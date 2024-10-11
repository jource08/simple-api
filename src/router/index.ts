import express from 'express';
import { forgotPassword, login, register, resetPassword } from '../controllers/authentication';
import { getAllUsers, updateUser } from '../controllers/users';
import { isAuthenticated } from '../middleware';

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.get('/users', isAuthenticated, getAllUsers);
router.put('/users/:id', isAuthenticated, updateUser);

export default router;
