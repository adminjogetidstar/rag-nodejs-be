import dotenv from "dotenv";
import askHandler from "../utils/ask_handler.js";

dotenv.config();

const postAsk = async (req, res) => {
  const { question, userId } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "Question is required"
    });
  }
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required"
    });
  }

  try {
    const result = await askHandler(question, userId);

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