import express from "express";
import { upload, postFiles, getFiles, deleteFiles } from "../controllers/file.controller.js";

const router = express.Router();

router.post("/", upload.array("file"), postFiles);
router.get("/", getFiles);
router.delete("/", deleteFiles);

export default router;