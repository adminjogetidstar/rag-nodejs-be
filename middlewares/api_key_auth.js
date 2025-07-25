import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;

const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  let isApiKeyValid = false;
  
  if (apiKey && apiKey === API_KEY) {
    isApiKeyValid = true;
  }

  if (isApiKeyValid) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "You must provide a valid API key"
  });
}

export default apiKeyAuth;