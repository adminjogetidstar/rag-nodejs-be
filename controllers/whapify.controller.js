import dotenv from "dotenv";
import askHandler from "../utils/ask_handler.js";
import FormData from "form-data";
import axios from "axios";
import moment from "moment-timezone";
import { hashValue } from "../utils/encryption_util.js";
import { PhoneModel } from "../models/index.js";
import { fetchImageAsBase64 } from "../utils/images_helper.js";
import { generateCatalogPdf } from "../utils/file_helper.js";

dotenv.config();

const WEBHOOK_SECRET = process.env.WHAPIFY_WEBHOOK_SECRET;
const API_KEY = process.env.WHAPIFY_API_KEY;
const ID = process.env.WHAPIFY_ACCOUNT_UNIQUE_ID;
const BASE_URL = process.env.WHAPIFY_BASE_URL;
const EXPIRED_DAYS = parseInt(process.env.EXPIRED_DAYS ?? "30", 10);

async function sendWhatsapp(recipient, message, type = "text", filePath = null) {
  const normalizedRecipient = recipient.startsWith("+")
    ? recipient.slice(1)
    : recipient;

  const form = new FormData();
  form.append("secret", API_KEY);
  form.append("account", ID);
  form.append("recipient", normalizedRecipient);

  if (type === "file" && filePath) {
    form.append("type", "file");
    form.append("file", require("fs").createReadStream(filePath));
    form.append("caption", message ?? "");
  } else {
    form.append("type", "text");
    form.append("message", message);
  }

  const url = `${BASE_URL}/send/whatsapp`;
  const response = await axios.post(url, form, { headers: form.getHeaders() });
  console.log("Message sent:", response.data);
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
        return res.status(response.status).send(response.data);
      } catch (err) {
        console.error(
          "Error sending not-registered message:",
          err?.response?.data ?? err.message
        );
        return res.status(500).send("Something went wrong");
      }
    }

    // Cek expired subscription
    const now = moment();
    let updatedAtMoment;
    if (phone.updatedAt) {
      updatedAtMoment = moment(phone.updatedAt, moment.ISO_8601, true);
      if (!updatedAtMoment.isValid()) {
        updatedAtMoment = moment(phone.updatedAt, "M/D/YYYY, h:mm:ss A");
      }
    } else if (phone.createdAt) {
      updatedAtMoment = moment(phone.createdAt, moment.ISO_8601, true);
      if (!updatedAtMoment.isValid()) {
        updatedAtMoment = moment(phone.createdAt, "M/D/YYYY, h:mm:ss A");
      }
    } else {
      updatedAtMoment = now;
    }

    const diffDays = now.diff(updatedAtMoment, "days");
    if (diffDays > EXPIRED_DAYS) {
      await PhoneModel.update(
        { status: "inactive" },
        { where: { id: phone.id } }
      );
      phone = await PhoneModel.findOne({ where: { numberHash: hashNumber } });
    }

    if (phone && phone.status === "inactive") {
      try {
        const response = await sendWhatsapp(
          userId,
          "Nomor anda sudah tidak aktif di sistem kami. Silakan hubungi admin untuk bantuan lebih lanjut."
        );
        return res.status(response.status).send(response.data);
      } catch (err) {
        console.error(
          "Error sending inactive message:",
          err?.response?.data ?? err.message
        );
        return res.status(500).send("Something went wrong");
      }
    }

    // === Ask AI ===
    let images = [];
    if (body.data?.attachment) {
      const base64Img = await fetchImageAsBase64(body.data.attachment);
      if (base64Img) {
        images = [base64Img];
      }
    }
    const result = await askHandler(question, userId, images);
    const finalAnswer =
      result?.answer ?? "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.";

    // === Tentukan format jawaban ===
    const isPdfRequest = /pdf/i.test(question) || /katalog/i.test(question);
    const isExcelRequest = /excel/i.test(question);

    if (isPdfRequest) {
      try {
        const pdfPath = await generateCatalogPdf(finalAnswer, "Katalog Produk");
        const response = await sendWhatsapp(
          userId,
          "Berikut katalog dalam format PDF:",
          "file",
          pdfPath
        );
        return res.status(response.status).send(response.data);
      } catch (err) {
        console.error("Error generating/sending PDF:", err);
        return res.status(500).send("Failed to generate PDF");
      }
    } else if (isExcelRequest) {
      try {
        const response = await sendWhatsapp(
          userId,
          "Fitur export ke Excel belum tersedia."
        );
        return res.status(response.status).send(response.data);
      } catch (err) {
        console.error("Error sending excel message:", err);
        return res.status(500).send("Something went wrong");
      }
    }

    // === Default: kirim jawaban text ===
    try {
      const response = await sendWhatsapp(userId, finalAnswer);
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
    console.error(
      "Error Whapify getSubscription:",
      err?.response?.data ?? err.message
    );
    return res.status(500).send("Something went wrong");
  }
};

export { webhookHandler, getSubscription };
