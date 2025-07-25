import express from 'express';
import { getJwtFromGoogle, getUserInfo } from '../controllers/auth.controller.js';
import jwtAuth from '../middlewares/jwt_auth.js';

const router = express.Router();

router.post("/google", getJwtFromGoogle)
router.get("/user-info", jwtAuth, getUserInfo)

export default router;
