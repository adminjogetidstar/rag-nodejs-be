import express from "express";
import dotenv from "dotenv";
import router from "./routes/route.js";
import cors from "cors";
import sequelize from "./models/index.js";

dotenv.config();
const app = express();

const FE_URL=process.env.FE_URL;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
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


