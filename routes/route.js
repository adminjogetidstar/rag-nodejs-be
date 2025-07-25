import express from "express";
import uploadRouter from "./upload.route.js";
import collectionRouter from "./collection.route.js";
import askRouter from "./ask.route.js";
import authRouter from "./auth.route.js"
import whapifyRouter from "./whapify.route.js"
import jwtApiKeyAuth from "../middlewares/jwt_api_key_auth.js";
import jwtAuth from "../middlewares/jwt_auth.js";

const router = express.Router();

router.use("/auth", authRouter)
router.use("/ask", jwtApiKeyAuth, askRouter);
router.use("/upload", jwtApiKeyAuth, uploadRouter);
router.use("/collections", jwtApiKeyAuth, collectionRouter);
router.use("/whapify", whapifyRouter);

export default router;