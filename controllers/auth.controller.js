import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const getJwtFromGoogle = async (req, res) => {
    const { idToken } = req.body;

    try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    const token = jwt.sign(
      { userId: sub, email, name },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
        success: true,
        message: "Generate JWT success",
        data: {
            token
        }
    });
  } catch (err) {
    console.error('Error during generate JWT:', err);
    res.status(401).json({ message: 'Invalid Google ID Token' });
  }
}

export { getJwtFromGoogle };