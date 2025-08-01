import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { ChromaClient } from "chromadb";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// Inisialisasi LLM
const geminiLlm = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0,
});

// Inisialisasi embeddings
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "models/embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});

// Inisialisasi Chroma client
const chromaClient = new ChromaClient({ baseUrl: process.env.CHROMA_URL });
// const qdrantClinet = new QdrantClient({ baseUrl: process.env.QDRANT_URL });

const mask = (obj, globalValueMap = {}) => {
  const masked = {};
  const maskMap = {};

  for (const [key, value] of Object.entries(obj)) {
    const valStr = value?.toString?.() ?? "";
    if (valStr === "") {
      masked[key] = valStr;
      continue;
    }

    let maskKey;
    
    if (globalValueMap[valStr]) {
      maskKey = globalValueMap[valStr]; // pakai UUID yang sudah ada
    } else {
      maskKey = `[MASK_${uuidv4()}]`; // UUID baru
      globalValueMap[valStr] = maskKey;
    }

    masked[key] = maskKey;
    maskMap[maskKey] = valStr;
  }

  return { masked, maskMap, globalValueMap };
};

const unmask = (text, maskMap) => {
    let result = text;

    for (const [key, value] of Object.entries(maskMap)) {
        result = result.replaceAll(key, value);
    }

    return result;
}

const extractCandidatesFromQuestion = (question) => {
    const matches = [];
    // Tangkap semua isi dalam [ ... ]
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(question)) !== null) {
        matches.push(match[1].trim());
    }

    return matches;
};

const maskQuestionIfNeeded = (question, globalValueMap) => {
    const candidates = extractCandidatesFromQuestion(question);
    let maskedQuestion = question;
    // Bikin globalValueMap versi lowercase → untuk pencocokan case-insensitive
    const lowerCaseMap = {};

    for (const [key, val] of Object.entries(globalValueMap)) {
        lowerCaseMap[key.toLowerCase()] = val;
    }

    for (const candidate of candidates) {
        const candidateLower = candidate.toLowerCase();
        const maskValue = lowerCaseMap[candidateLower];

        if (maskValue) {
        // Regex untuk menggantikan [KARYAWAN 30] → [MASK_xyz]
        const pattern = new RegExp(`\\[${candidate}\\]`, "gi"); // g = global, i = ignore case
        maskedQuestion = maskedQuestion.replace(pattern, maskValue);
        }
    }

    return maskedQuestion;
};

const askHandler = async (question, userId) => {
    try {
        const queryEmbedding = await geminiEmbeddings.embedQuery(question);
        const collection = await chromaClient.getCollection({ name: process.env.COLLECTION_NAME });

        const manual = await collection.query({
            queryEmbeddings: [queryEmbedding],
            where: { userId: "default"},
            nResults: 1000,
            include: ["documents", "metadatas", "distances"],
        });

        const allMatches = manual.documents[0].map((doc, i) => ({
            document: doc,
            metadata: manual.metadatas[0][i],
            distance: manual.distances[0][i],
        }));

        // const manual = await qdrantClinet.search(process.env.COLLECTION_NAME, {
        //     vector: queryEmbedding,
        //     limit: 100,
        //     with_payload: true,
        // });

        // const allMatches = manual.map((item) => ({
        //     document: item.payload.content,
        //     metadata: item.payload.metadata,
        //     distance: item.score
        // }))

        const combined = allMatches
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 100);

        let fullContext = "";
        let fullMaskMap = {};
        let globalValueMap = {};

        combined.forEach((item, index) => {
            let parsed;
            try {
                parsed = JSON.parse(item.document); // asumsikan doc berupa JSON string
            } catch (e) {
                parsed = { content: item.document }; // fallback jika bukan JSON
            }

            const { masked, maskMap, globalValueMap: updatedGlobalValueMap } = mask(parsed, globalValueMap);
            globalValueMap = updatedGlobalValueMap;
            Object.assign(fullMaskMap, maskMap);

            fullContext += JSON.stringify(masked, null, 2) + "\n\n";
            // fullContext += item.document + "\n\n";
        });

        const sources = combined
            .map((item) => ({
                source: item.metadata.source,
                distances: item.distance,
        }));

        const finalQuestion = maskQuestionIfNeeded(question, globalValueMap);

        const prompt = `Jawablah pertanyaan di bawah ini hanya berdasarkan informasi dari dokumen yang disediakan. Jika informasi tidak ditemukan, jawab: "Saya tidak tahu".\n\nDokumen:\n${fullContext}\n\nPertanyaan: ${finalQuestion}\n\n`;
        console.log("Prompt:", prompt);

        const result = await geminiLlm.invoke(prompt);
        let answer = result.content.trim();

        answer = unmask(answer, fullMaskMap);

        console.log("Response generated successfully");

        return {
            question,
            answer,
            sources
        }
    } catch (err) {
        console.error("Error in askHandler", err);
    }
}

export default askHandler;