import express from "express";
import { getSubscription, webhookHandler } from "../controllers/whapify.controller.js";

const router = express.Router();

router.post("/webhook", webhookHandler)
router.get("/subscription", getSubscription)

export default router;