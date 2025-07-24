import dotenv from "dotenv";

dotenv.config();

const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      message: "Invalid API Key"
    })
  }

  next();
}

export default apiKeyAuth;