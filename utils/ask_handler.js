import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { ChromaClient } from "chromadb";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { HumanMessage } from "@langchain/core/messages";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const geminiLlm = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0,
});

const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chromaClient = new ChromaClient({
  host: process.env.CHROMA_HOST,
  port: parseInt(process.env.CHROMA_PORT),
  ssl: process.env.CHROMA_SSL === "true",
});

const MASK = false;

// fungsi kecil buat escape regex
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");

const mask = (obj, globalValueMap = {}) => {
  const masked = {};
  const maskMap = {};

  for (const [key, value] of Object.entries(obj)) {
    const valStr = value?.toString?.() ?? "";
    if (valStr === "") {
      masked[key] = valStr;
      continue;
    }

    const lookupKey = valStr.toLowerCase();
    let maskKey;

    if (globalValueMap[lookupKey]) {
      maskKey = globalValueMap[lookupKey];
    } else {
      maskKey = `[MASK_${uuidv4()}]`;
      globalValueMap[lookupKey] = maskKey;
    }

    masked[key] = maskKey;
    maskMap[maskKey] = valStr;
  }

  return { masked, maskMap, globalValueMap };
};

const unmask = (text, maskMap) => {
  let result = text;
  for (const [key, value] of Object.entries(maskMap)) {
    const regex = new RegExp(escapeRegExp(key), "g");
    result = result.replace(regex, value);
  }
  return result;
};

const maskQuestionIfNeeded = (question, globalValueMap) => {
  let maskedQuestion = question;
  for (const [originalValue, maskValue] of Object.entries(globalValueMap)) {
    const escapedValue = escapeRegExp(originalValue);
    const regex = new RegExp(`\\b${escapedValue}\\b`, "gi");
    maskedQuestion = maskedQuestion.replace(regex, maskValue);
  }
  return maskedQuestion;
};

const askHandler = async (question, userId, images) => {
  try {
    // --- Dapatkan embedding untuk pertanyaan ---
    const queryEmbedding = await geminiEmbeddings.embedQuery(question);

    const collection = await chromaClient.getCollection({
      name: process.env.COLLECTION_NAME,
    });

    const manual = await collection.query({
      queryEmbeddings: [queryEmbedding],
      where: { userId: "default" },
      nResults: 1000,
      include: ["documents", "metadatas", "distances"],
    });

    const allMatches = manual.documents[0].map((doc, i) => ({
      document: doc,
      metadata: manual.metadatas[0][i],
      distance: manual.distances[0][i],
    }));

    const combined = allMatches
      .toSorted((a, b) => a.distance - b.distance)
      .slice(0, 100);

    // --- Bangun konteks dari dokumen ---
    let fullContext = "";
    let fullMaskMap = {};
    let globalValueMap = {};

    combined.forEach((item) => {
      if (MASK) {
        let parsed;
        try {
          parsed = JSON.parse(item.document);
        } catch {
          parsed = { content: item.document };
        }
        const {
          masked,
          maskMap,
          globalValueMap: updatedGlobalValueMap,
        } = mask(parsed, globalValueMap);

        globalValueMap = updatedGlobalValueMap;
        Object.assign(fullMaskMap, maskMap);
        fullContext += JSON.stringify(masked, null, 2) + "\n\n";
      } else {
        fullContext += item.document + "\n\n";
      }
    });

    const sources = combined.slice(0, 10).map((item) => ({
      source: item.metadata.source,
      distance: item.distance,
    }));

    const finalQuestion = maskQuestionIfNeeded(question, globalValueMap);

    const prompt = `
        Jawablah pertanyaan di bawah ini hanya berdasarkan informasi dari dokumen yang disediakan.
        Jika informasi yang ditanyakan tidak ada di dalam dokumen, berikan jawaban yang sopan dan membantu, misalnya
        - Memberitahukan informasi apa yang tersedia dalam dokumen.
        - Menyampaikan keterbatasan dengan ramah.
        - Menyarankan sumber alternatif atau langkah lanjutan yang relevan.
        Dokumen:
        ${fullContext}
        Pertanyaan:
        ${finalQuestion}
        `;
    console.log("Prompt:", prompt);

    let answer = "";
    
    if (images.length > 0) {
      prompt += `
        Selain itu, analisis juga gambar yang dilampirkan untuk memberikan jawaban yang lebih akurat dan lengkap.
        Jika isi dokumen tidak cukup, gunakan informasi dari gambar sebagai referensi tambahan.
        `;
      // === Mode multimodal pakai GoogleGenerativeAI ===
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const parts = [{ text: prompt }];

      for (const img of images) {
        parts.push({
          inlineData: {
            data: img.replace(/^data:image\/\w+;base64,/, ""), // hapus prefix base64
            mimeType: "image/png", // bisa deteksi mime type sesuai upload
          },
        });
      }

      const result = await model.generateContent(parts);
      answer = result.response.text();
    } else {
      // === Mode teks-only pakai LangChain ===
      const messages = new HumanMessage({ role: "user", content: prompt });
      const result = await geminiLlm.invoke([messages]);

      if (Array.isArray(result.content)) {
        answer = result.content
          .map((c) => c.text ?? "")
          .join(" ")
          .trim();
      } else {
        answer = result.content?.toString().trim() ?? "";
      }
    }

    if (MASK) {
      answer = unmask(answer, fullMaskMap);
    }

    return {
      question,
      answer,
      sources,
    };
  } catch (err) {
    console.error("Error in askHandler:", err);
    throw err;
  }
};

export default askHandler;
