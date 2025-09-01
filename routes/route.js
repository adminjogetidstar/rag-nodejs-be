import express from "express";
import fileRouter from "./file.route.js";
import collectionRouter from "./collection.route.js";
import askRouter from "./ask.route.js";
import authRouter from "./auth.route.js"
import whapifyRouter from "./whapify.route.js"
import phoneRouter from "./phone.route.js"
import jwtApiKeyAuth from "../middlewares/jwt_api_key_auth.js";
import jwtAuth from "../middlewares/jwt_auth.js";
import roleRouter from "./role.route.js";
import userRouter from "./user.route.js";
import sheetRouter from "./sheet.route.js";
import roleAuth from "../middlewares/role_auth.js";

const router = express.Router();
router.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});
router.use("/auth", authRouter)
router.use("/ask", jwtAuth, askRouter);
router.use("/files", jwtAuth, roleAuth("admin"), fileRouter);
router.use("/collections", jwtAuth, roleAuth("admin"), collectionRouter);
router.use("/whapify", whapifyRouter);
router.use("/phones", jwtAuth, roleAuth("admin"), phoneRouter);
router.use("/roles", jwtAuth, roleAuth("admin"), roleRouter);
router.use("/users", jwtAuth, roleAuth("admin"), userRouter);
router.use("/sheets", jwtAuth, roleAuth("admin"), sheetRouter);

export default router;