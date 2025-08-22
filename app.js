import express from "express";
import dotenv from "dotenv";
import router from "./routes/route.js";
import cors from "cors";
import { sequelize } from "./models/index.js";
import rateLimit from "express-rate-limit";
import auditLogger from "./middlewares/audit_logger.js";

dotenv.config();
const app = express();

const FE_URL=process.env.FE_URL;
const RATE_LIMIT_MINUTES = process.env.RATE_LIMIT_MINUTES;
const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS;

const limiter = rateLimit({
  windowMs: RATE_LIMIT_MINUTES * 60 * 1000, // Maksimal request per berapa menit
  max: RATE_LIMIT_MAX_REQUESTS, // Maksimal berapa request per IP per window
  standardHeaders: true, // Mengirimkan info limit di headers
  legacyHeaders: false, // Nonaktifkan header X-RateLimit-*
  message: "Too many request, try again later."
});

app.use(limiter);
app.use(auditLogger)

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT;

app.use("/", router);

sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log("RAG API is running on port:", PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to connect database:", err);
  });


