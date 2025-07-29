import express from "express";
import { getUploadedFiles, upload, uploadHandler } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", upload.array("file"), uploadHandler);
router.get("/", getUploadedFiles);

export default router;