// import pkg from 'whatsapp-web.js';
// const { Client, LocalAuth } = pkg
// import qrcode from 'qrcode-terminal';
// import askHandler from "./ask_handler.js";

// const whatsappBot = async () => {
//   //Inisialisasi Client whatsapp-web.js
//   const client = new Client({
//     authStrategy: new LocalAuth()
//   });

//   //Generate QR code
//   client.on('qr', (qr) => {
//     qrcode.generate(qr, { small: true });
//     console.log("Scan QR Code for Whatsapp login");
//   });

//   //Client ready
//   client.on('ready', () => {
//     console.log('WhatsApp Bot ready!');
//   });

//   //Client mendapatkan pesan
//   client.on('message', async (message) => {
//     // const keyword = message.body.trim().includes("/ask");
//     // if (!keyword) return;

//     // const text = message.body.trim().replace("/ask", "");
//     const text = message.body.trim();
//     const userId = message.from.trim();
//     if (!text) return;

//     try {
//       const result = await askHandler(text, userId);

//       // Batasi panjang pesan
//       if (result.answer.length > 4000) {
//         return message.reply(answer.slice(0, 3900) + "\n\n(dipotong)");
//       }

//       message.reply(result.answer);
//     } catch (err) {
//       console.error("Error whatsappBot:", err);
//       message.reply("Terjadi kesalahan. Coba lagi nanti.");
//     }
//   });

//   client.initialize();
// }

// export default whatsappBot;