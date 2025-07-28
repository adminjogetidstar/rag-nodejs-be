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
const chromaClient = new ChromaClient({ baseUrl: process.env.CHROMA_URL });

const askHandler = async (question, userId) => {
    try {
        const queryEmbedding = await geminiEmbeddings.embedQuery(question);
        const collection = await chromaClient.getCollection({ name: process.env.COLLECTION_NAME });

        let allMatches = [];

        if (userId) {
            const history = await collection.query({
                queryEmbeddings: [queryEmbedding],
                where: { userId },
                nResults: 10,
                include: ["documents", "metadatas", "distances"],
            });

            if (history.documents?.[0]?.length > 0) {
                allMatches.push(
                ...history.documents[0].map((doc, i) => ({
                    document: doc,
                    metadata: history.metadatas[0][i],
                    distance: history.distances[0][i],
                }))
                );
            }
        }

        const manual = await collection.query({
        queryEmbeddings: [queryEmbedding],
        where: { userId: "default"},
        nResults: 10,
        include: ["documents", "metadatas", "distances"],
        });

        allMatches.push(
        ...manual.documents[0].map((doc, i) => ({
            document: doc,
            metadata: manual.metadatas[0][i],
            distance: manual.distances[0][i],
        }))
        );

        const combined = allMatches
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);

        const context = combined.map((item) => item.document).join("\n\n");
        const sources = combined
        .map((item) => ({
            source: item.metadata.source,
            distances: item.distance,
        }))

        const prompt = `Jawablah pertanyaan di bawah ini hanya berdasarkan informasi dari dokumen yang disediakan. Jika informasi tidak ditemukan, jawab: "Saya tidak tahu".\n\nDokumen:\n${context}\n\nPertanyaan: ${question}\n\n`;
        console.log("Prompt:", prompt);

        const result = await geminiLlm.invoke(prompt);
        const answer = result.content.trim();

        if (!answer.toLowerCase().includes("tidak tahu")) {
            const qaText = `Q: ${question}\nA: ${answer}`;
            const qaEmbedding = await geminiEmbeddings.embedQuery(qaText);

            await collection.add({
                ids: [uuidv4()],
                documents: [qaText],
                embeddings: [qaEmbedding],
                metadatas: [{
                extension: "qa",
                source: question,
                fileName: `${Date.now()}_${question}`,
                userId,
                }]
            });
        }

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