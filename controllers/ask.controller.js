import dotenv from "dotenv";
import askHandler from "../utils/ask_handler.js";

dotenv.config();

const postAsk = async (req, res) => {
  try {
    const user = req.user;
    const { question, images = [] } = req.body;
    console.log(images);
    if (user?.chat === "inactive") {
      return res.status(403).json({
        success: false,
        message:
          "Akun anda belum diizinkan untuk chat di sistem kami. Silakan hubungi admin untuk bantuan lebih lanjut.",
      });
    }

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required and must be a non-empty string.",
      });
    }

    if (!Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Images must be an array of base64 strings.",
      });
    }

    const result = await askHandler(question.trim(), user.id, images);

    return res.status(200).json({
      success: true,
      data: result,
      message: "Response generated successfully.",
    });
  } catch (err) {
    console.error("Error during POST /ask:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while processing your request.",
    });
  }
};

export { postAsk };