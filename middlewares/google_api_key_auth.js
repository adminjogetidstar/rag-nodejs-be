import dotenv from "dotenv";

dotenv.config();

const googleApiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const isGoogleLoggedIn = req.isAuthenticated && req.isAuthenticated();
  
  if ((!apiKey || apiKey !== process.env.API_KEY) && !isGoogleLoggedIn) {
    return res.status(403).json({
      success: false,
      message: "You must login via Google or invalid API key"
    })
  }

  next();
}

export default googleApiKeyAuth;