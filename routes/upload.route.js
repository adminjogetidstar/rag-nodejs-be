import express from "express";
import { upload, uploadHandler } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", upload.array("file"), uploadHandler);

export default router;