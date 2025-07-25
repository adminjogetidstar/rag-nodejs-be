// routes/auth.js
import express from 'express';
import passport from 'passport';
import googleAuth from '../middlewares/google_auth.js';

const router = express.Router();

// GET /auth/google
router.get("/google",
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /auth/google/callback
router.get("/google/callback",
  passport.authenticate('google', { failureRedirect: '/auth/google' }),
  (req, res) => {
    res.redirect('/auth/user-info');
  }
);

// GET /auth/logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect('/auth/google');
  });
});

router.get("/user-info", googleAuth, (req, res) => {
    res.json({
        success: true,
        message: "Login Success",
        data: req.user
    })
})

export default router;
