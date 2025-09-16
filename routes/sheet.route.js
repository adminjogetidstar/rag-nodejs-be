import express from "express";
import { indexSheets } from "../controllers/sheet.controller.js";
import { getDriveFiles } from "../controllers/drive.controller.js";

const router = express.Router();

router.post("/index", indexSheets);
router.get("/files", getDriveFiles);

export default router;