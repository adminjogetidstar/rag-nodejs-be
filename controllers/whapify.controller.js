import dotenv from "dotenv";
import askHandler from "../utils/ask_handler.js";
import FormData from "form-data";
import axios from "axios";
import Phone from "../models/phone.js";
import moment from "moment-timezone";
import { hashValue } from "../utils/encryption_util.js";

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
        const hashNumber = hashValue(userId);

        const formData = new FormData();
        formData.append("secret", API_KEY);
        formData.append("account", ID);
        formData.append("recipient", userId);
        formData.append("type", "text");

        let phone = await Phone.findOne({ where: { number_hash: hashNumber } });
        if (!phone) {
            formData.append("message", "Nomor anda tidak terdaftar di sistem kami. Silakan hubungi admin untuk bantuan lebih lanjut.");

            try {
                const url = `${BASE_URL}/send/whatsapp`;

                const response = await axios.post(url, formData, { headers: formData.getHeaders() });

                return res.status(response.status).send(response.data);
            } catch (err) {
                console.error("Error Whapify:", err);
                return res.status(500).send("Something went wrong");
            }
        }

        const now = moment();
        const createdAt = moment(phone.createdAt);
        const diffDays = now.diff(createdAt, 'days');

        if (diffDays > 30) {
            await Phone.update({ status: "inactive" }, { where: { id: phone.id } });

            phone = await Phone.findOne({ where: { number_hash: hashNumber } });
        }

        if (phone && phone.status === "inactive") {
            formData.append("message", "Nomor anda sudah tidak aktif di sistem kami. Silakan hubungi admin untuk bantuan lebih lanjut.");

            try {
                const url = `${BASE_URL}/send/whatsapp`;

                const response = await axios.post(url, formData, { headers: formData.getHeaders() });

                return res.status(response.status).send(response.data);
            } catch (err) {
                console.error("Error Whapify:", err);
                return res.status(500).send("Something went wrong");
            }
        }

        const result = await askHandler(question, userId);
        formData.append("message", result.answer);

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