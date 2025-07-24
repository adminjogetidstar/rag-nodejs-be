import express from "express";
import { getCollections, deleteCollections, postCollections } from "../controllers/collection.controller.js";

const router = express.Router();

router.post("/", postCollections);
router.get("/", getCollections);
router.delete("/", deleteCollections);

export default router;