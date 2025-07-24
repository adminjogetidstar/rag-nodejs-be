
const googleAuth = async (req, res, next) => {
  const isGoogleLoggedIn = req.isAuthenticated && req.isAuthenticated();
  
  if (!isGoogleLoggedIn) {
    return res.status(403).json({
      success: false,
      message: "You must login via Google first"
    })
  }

  next();
}

export default googleAuth;