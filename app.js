import express from "express";
import dotenv from "dotenv";
import router from "./routes/route.js";
import whatsappBot from "./utils/whatsapp_bot.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

//Passport init
app.use(passport.initialize());
app.use(passport.session());

// Google Strategy SSO
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

//Simpan data user google ke session
passport.serializeUser((user, done) => {
  done(null, user);
});
//Mengambil data session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const PORT = process.env.PORT;

app.use("/", router);

app.listen(PORT, () => {
  console.log("RAG API is running on port:", PORT);
  // whatsappBot();
});
