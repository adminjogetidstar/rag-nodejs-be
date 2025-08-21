import express from "express";
import { deletePhones, getPhones, postPhone, putPhone } from "../controllers/phone.controller.js";

const router = express.Router();

router.post("/", postPhone);
router.get("/", getPhones);
router.put("/", putPhone);
router.delete("/", deletePhones)

export default router;