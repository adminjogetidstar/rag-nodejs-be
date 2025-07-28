import express from "express";
import dotenv from "dotenv";
import router from "./routes/route.js";
import whatsappBot from "./utils/whatsapp_bot.js";
import cors from "cors";

dotenv.config();
const app = express();

const FE_URL=process.env.FE_URL;

app.use(cors({
  origin: FE_URL,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT;

app.use("/", router);

app.listen(PORT, () => {
  console.log("RAG API is running on port:", PORT);
  // whatsappBot();
});
