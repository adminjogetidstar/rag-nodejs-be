import express from "express";
import { deleteUsers, getUsers, putUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", getUsers);
router.put("/", putUser);
router.delete("/", deleteUsers)

export default router;