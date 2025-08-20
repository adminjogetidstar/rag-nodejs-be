import dotenv from "dotenv";
import askHandler from "../utils/ask_handler.js";
import FormData from "form-data";
import axios from "axios";

dotenv.config();

const WEBHOOK_SECRET = process.env.WHAPIFY_WEBHOOK_SECRET;
const API_KEY = process.env.WHAPIFY_API_KEY;
const ID = process.env.WHAPIFY_ACCOUNT_UNIQUE_ID;
const BASE_URL = process.env.WHAPIFY_BASE_URL

const webhookHandler = async (req, res) => {
    const body = req.body;

    const secret = body.secret;

    if (secret && secret === WEBHOOK_SECRET && body.type === "whatsapp") {
        const question = body.data.message;
        const userId = body.data.phone;

        const result = await askHandler(question, userId);

        const formData = new FormData();
        formData.append("secret", API_KEY);
        formData.append("account", ID);
        formData.append("recipient", userId);
        formData.append("message", result.answer);
        formData.append("type", "text");

        try {
            const url = `${BASE_URL}/send/whatsapp`;

            const response = await axios.post(url, formData, { headers: formData.getHeaders() });

            return res.status(response.status).send(response.data);
        } catch (err) {
            console.error("Error Whapify:", err);
            return res.status(500).send("Something went wrong");
        }
    } else {
        return res.status(403).send("Invalid Secret Key & Just receiving Whatsapp message");
    }
}

const getSubscription = async (req, res) => {
    try {
        const url = `${BASE_URL}/get/subscription?secret=${API_KEY}`
        const response = await axios.get(url, {
            headers: {
                "Content-Type": "application/json",
            }
        });

        return res.status(response.status).send(response.data);
    } catch (err) {
        console.error("Error Whapify:", err);
        return res.status(500).send("Something went wrong");
    }
}

export { webhookHandler, getSubscription };