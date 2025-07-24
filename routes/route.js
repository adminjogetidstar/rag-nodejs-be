import express from "express";
import uploadRouter from "./upload.route.js";
import collectionRouter from "./collection.route.js";
import askRouter from "./ask.route.js";
import apiKeyAuth from "../middlewares/api_key_auth.js";

const router = express.Router();

router.use(apiKeyAuth);

router.use("/ask", askRouter);
router.use("/upload", uploadRouter);
router.use("/collections", collectionRouter);

export default router;