import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { encrypt, decrypt, hashValue } from "../utils/encryption_util.js";
import { RoleModel, UserModel, UserRoleModel } from "../models/index.js";

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
        const { sub, email, name, picture } = payload;

        let user = await UserModel.findOne({ where: { id: sub } });
        let userRole = await UserRoleModel.findOne({ where: { userId: sub } });
        let roleUser = await RoleModel.findOne({ where: { name: "user" } });

        if (!roleUser) {
            roleUser = await RoleModel.create({ name: "user" });
        }

        if (!user) {
            user = await UserModel.create({
                id: sub,
                email: encrypt(email),
                emailHash: hashValue(email),
                name
            });
            userRole = await UserRoleModel.create({
                userId: sub,
                roleId: roleUser.id
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: decrypt(user.email),
                name: user.name,
                picture,
                roleId: userRole.roleId,
                role: roleUser.name
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: "Generate JWT success",
            data: {
                token,
            }
        });
    } catch (err) {
        console.error("Error during POST /auth/google:", err);
        res.status(401).json({
            succes: false,
            message: "Invalid Google ID Token"
        });
    }
}

const getUserInfo = async (req, res) => {
    const {
        userId,
        email,
        name,
        picture,
        roleId,
        role,
        iat,
        exp
    } = req.user;
    try {
        res.json({
            success: true,
            message: "Get user info success",
            data: {
                userId,
                email,
                name,
                picture,
                roleId,
                role,
                iat,
                exp
            },
        });
    } catch (err) {
        console.error("Error during GET /auth/user-info:", err);
        res.status(500).json({
            succes: false,
            message: "Something went wrong"
        });
    }
}

export { getJwtFromGoogle, getUserInfo };