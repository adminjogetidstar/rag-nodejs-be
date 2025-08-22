import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const API_KEY = process.env.API_KEY;

const jwtApiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  let isJwtValid = false;
  let isApiKeyValid = false;
  
  if (apiKey && apiKey === API_KEY) {
    isApiKeyValid = true;
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      isJwtValid = true;
    } catch (err) {
      console.warn("JWT verification failed:", err.message);
    }
  }

  if (isJwtValid || isApiKeyValid) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "You must provide a valid API key or JWT"
  });
}

export default jwtApiKeyAuth;