import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
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
const chromaClient = new ChromaClient({ path: process.env.CHROMA_URL });
// const qdrantClinet = new QdrantClient({ baseUrl: process.env.QDRANT_URL });

const escapeRegExp = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
};

const mask = (obj, globalValueMap = {}) => {
    const masked = {};
    const maskMap = {};

    for (const [key, value] of Object.entries(obj)) {
        const valStr = value?.toString?.() ?? "";
        if (valStr === "") {
            masked[key] = valStr;
            continue;
        }

        const lookupKey = valStr.toLowerCase(); // Case-insensitive key
        let maskKey;

        if (globalValueMap[lookupKey]) {
            maskKey = globalValueMap[lookupKey]; // gunakan mask yang sudah ada
        } else {
            maskKey = `[MASK_${uuidv4()}]`; // buat mask baru
            globalValueMap[lookupKey] = maskKey;
        }

        masked[key] = maskKey;
        maskMap[maskKey] = valStr; // Simpan original value untuk unmasking
    }

    return { masked, maskMap, globalValueMap };
};

const unmask = (text, maskMap) => {
    let result = text;

    for (const [key, value] of Object.entries(maskMap)) {
        const regex = new RegExp(escapeRegExp(key), "g"); // exact match
        result = result.replace(regex, value);
    }

    return result;
};

const extractCandidatesFromQuestion = (question) => {
    const matches = [];
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(question)) !== null) {
        matches.push(match[1].trim());
    }

    return matches;
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

const MASK = false;

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
            if (MASK) {
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
            } else {
                fullContext += item.document + "\n\n";
            }
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

        answer = MASK ? unmask(answer, fullMaskMap) : answer;

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