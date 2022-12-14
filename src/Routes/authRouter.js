/* eslint-disable import/extensions */
import express from 'express';
import * as authController from '../Controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', authController.registerUser);
router.post('/login', authController.loginUser);
router.delete('/sessions/:token', authController.removeUserSession);

export default router;
