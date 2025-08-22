import express from "express";
import { getRoles, postRole, putRole } from "../controllers/role.controller.js";

const router = express.Router();

router.post("/", postRole);
router.get("/", getRoles);
router.put("/", putRole);

export default router;