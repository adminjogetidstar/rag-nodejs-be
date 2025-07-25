import express from 'express';
import { getJwtFromGoogle } from '../controllers/auth.controller.js';

const router = express.Router();

router.post("/google", getJwtFromGoogle)

export default router;
