import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const jwtAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  let isJwtValid = false;

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

  if (isJwtValid) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "You must provide a valid JWT"
  });
}

export default jwtAuth;