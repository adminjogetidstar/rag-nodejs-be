import express from "express";
import { postAsk } from "../controllers/ask.controller.js";

const router = express.Router();

router.post("/", postAsk);

export default router;