import dotenv from "dotenv";
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg
import qrcode from 'qrcode-terminal';
import fetch from "node-fetch";

dotenv.config({ path: "../.env" });

const whatsappBot = async () => {
  const baseUrl = "http://localhost:3000";

  //Inisialisasi Client whatsapp-web.js
  const client = new Client({
    authStrategy: new LocalAuth()
  });

  //Generate QR code
  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("Scan QR Code for Whatsapp login");
  });

  //Client ready
  client.on('ready', () => {
    console.log('WhatsApp Bot ready!');
  });

  //Client mendapatkan pesan
  client.on('message', async (message) => {
    // const keyword = message.body.trim().includes("/ask");
    // if (!keyword) return;

    // const text = message.body.trim().replace("/ask", "");
    const text = message.body.trim();
    const userId = message.from.trim();
    if (!text) return;

    try {
      const response = await fetch(baseUrl + "/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_KEY,
        },
        body: JSON.stringify({ question: text, userId }),
      });

      const json = await response.json();

      if (!json.success) {
        return message.reply("Gagal menjawab pertanyaan.");
      }

      const answer = json.data.answer;

      // Batasi panjang pesan
      if (answer.length > 4000) {
        return message.reply(answer.slice(0, 3900) + "\n\n(dipotong)");
      }

      message.reply(answer);
    } catch (err) {
      console.error("Error:", err);
      message.reply("Terjadi kesalahan. Coba lagi nanti.");
    }
  });

  client.initialize();
}

export default whatsappBot;