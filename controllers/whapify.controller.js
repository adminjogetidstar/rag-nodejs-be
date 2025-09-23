import dotenv from "dotenv";
import askHandler from "../utils/ask_handler.js";
import FormData from "form-data";
import axios from "axios";
import moment from "moment-timezone";
import { hashValue } from "../utils/encryption_util.js";
import { PhoneModel } from "../models/index.js";

dotenv.config();

const WEBHOOK_SECRET = process.env.WHAPIFY_WEBHOOK_SECRET;
const API_KEY = process.env.WHAPIFY_API_KEY;
const ID = process.env.WHAPIFY_ACCOUNT_UNIQUE_ID;
const BASE_URL = process.env.WHAPIFY_BASE_URL;
const EXPIRED_DAYS = parseInt(process.env.EXPIRED_DAYS ?? "30", 10);

async function sendWhatsapp(recipient, message) {
  const formData = new FormData();
  formData.append("secret", API_KEY);
  formData.append("account", ID);
  formData.append("recipient", recipient);
  formData.append("type", "text");
  formData.append("message", message);

  const url = `${BASE_URL}/send/whatsapp`;
  const headers = formData.getHeaders();

  const response = await axios.post(url, formData, { headers });
  console.log(response);
  return response;
}

const webhookHandler = async (req, res) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).send("Empty body");

    console.log("Incoming webhook:", JSON.stringify(body));

    const secret = body.secret;
    if (!secret || secret !== WEBHOOK_SECRET || body.type !== "whatsapp") {
      return res
        .status(403)
        .send("Invalid Secret Key or not a Whatsapp webhook");
    }

    const question = body.data?.message ?? "";
    const userId = body.data?.phone;

    if (!userId) return res.status(400).send("Missing phone number in payload");

    const hashNumber = hashValue(userId);

    let phone = await PhoneModel.findOne({ where: { numberHash: hashNumber } });

    if (!phone) {
      console.log("Phone not found for", userId);
      try {
        const response = await sendWhatsapp(
          userId,
          "Nomor anda tidak terdaftar di sistem kami. Silakan hubungi admin untuk bantuan lebih lanjut."
        );
        console.log("Sent: not-registered response");
        return res.status(response.status).send(response.data);
      } catch (err) {
        console.error("Error sending not-registered message:", err?.response?.data ?? err.message);
        return res.status(500).send("Something went wrong");
      }
    }

    // Periksa expired based on updatedAt (fallback ke createdAt jika perlu)
    const now = moment();
    const updatedAtMoment = phone.updatedAt ? moment(phone.updatedAt) : moment(phone.createdAt || undefined);
    const diffDays = now.diff(updatedAtMoment, "days");

    if (diffDays > EXPIRED_DAYS) {
      await PhoneModel.update({ status: "inactive" }, { where: { id: phone.id } });
      phone = await PhoneModel.findOne({ where: { numberHash: hashNumber } });
    }

    if (phone && phone.status === "inactive") {
      try {
        const response = await sendWhatsapp(
          userId,
          "Nomor anda sudah tidak aktif di sistem kami. Silakan hubungi admin untuk bantuan lebih lanjut."
        );
        console.log("Sent: inactive response");
        return res.status(response.status).send(response.data);
      } catch (err) {
        console.error("Error sending inactive message:", err?.response?.data ?? err.message);
        return res.status(500).send("Something went wrong");
      }
    }

    // Jika semua OK, panggil askHandler (beri attachments kalau ada)
    const attachments = Array.isArray(body.data?.attachments) ? body.data.attachments : [];
    const result = await askHandler(question, userId, attachments);
    const finalAnswer = result?.answer ?? "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.";

    try {
      const response = await sendWhatsapp(userId, finalAnswer);
      console.log("Sent: answer message");
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Error sending answer message:", err?.response?.data ?? err.message);
      return res.status(500).send("Something went wrong");
    }
  } catch (err) {
    console.error("webhookHandler error:", err);
    return res.status(500).send("Internal server error");
  }
};

const getSubscription = async (req, res) => {
  try {
    const url = `${BASE_URL}/get/subscription?secret=${API_KEY}`;
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.status(response.status).send(response.data);
  } catch (err) {
    console.error("Error Whapify getSubscription:", err?.response?.data ?? err.message);
    return res.status(500).send("Something went wrong");
  }
};

export { webhookHandler, getSubscription };
