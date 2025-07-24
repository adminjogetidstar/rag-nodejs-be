import express from "express";
import uploadRouter from "./upload.route.js";
import collectionRouter from "./collection.route.js";
import askRouter from "./ask.route.js";
import authRouter from "./auth.route.js"
import googleApiKeyAuth from "../middlewares/google_api_key_auth.js";

const router = express.Router();

router.use("/auth", authRouter)
router.use("/ask", googleApiKeyAuth, askRouter);
router.use("/upload", googleApiKeyAuth, uploadRouter);
router.use("/collections", googleApiKeyAuth, collectionRouter);

export default router;