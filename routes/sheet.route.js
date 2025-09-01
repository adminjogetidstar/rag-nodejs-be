import express from "express";
import { indexSheets } from "../controllers/sheet.controller.js";

const router = express.Router();

router.post("/", indexSheets);

export default router;