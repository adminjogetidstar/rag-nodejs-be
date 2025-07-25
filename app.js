import express from "express";
import dotenv from "dotenv";
import router from "./routes/route.js";
import whatsappBot from "./utils/whatsapp_bot.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT;

app.use("/", router);

app.listen(PORT, () => {
  console.log("RAG API is running on port:", PORT);
  // whatsappBot();
});
