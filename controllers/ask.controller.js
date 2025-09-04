import dotenv from "dotenv";
import askHandler from "../utils/ask_handler.js";

dotenv.config();

const postAsk = async (req, res) => {
  const user = req.user;
  const { question } = req.body;

  if (user.chat === "inactive") {
    return res.status(403).json({
      success: false,
      message: "Akun anda belum diizinkan untuk chat di sistem kami. Silakan hubungi admin untuk bantuan lebih lanjut."
    });
  }

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "Question is required"
    });
  }

  try {
    const result = await askHandler(question, user.id);

    res.json({
      success: true,
      data: result,
      message: "Response generated successfully"
    });
  } catch (err) {
    console.error("Error during POST /ask:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

export { postAsk };