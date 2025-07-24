import express from "express";
import { askHandler } from "../controllers/ask.controller.js";

const router = express.Router();

router.post("/", askHandler);

export default router;