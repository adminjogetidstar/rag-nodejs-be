import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChromaClient } from "chromadb";
import dotenv from "dotenv";
import indexSheetsInFolder from "../utils/index_google_sheets.js";
import indexSelectedFiles from "../utils/index_selected_files.js";

dotenv.config();

// Inisialisasi Embeddings
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});

// Inisialisasi Chroma client
const chromaClient = new ChromaClient({
  host: process.env.CHROMA_HOST,
  port: parseInt(process.env.CHROMA_PORT),
  ssl: process.env.CHROMA_SSL === "true",
});

const indexSheets = async (req, res) => {
  const { clearAll, fileIds } = req.body || { clearAll: false };

  try {
    if (clearAll) {
      try {
        await chromaClient.deleteCollection({
          name: process.env.COLLECTION_NAME,
        });
        console.log(
          `Flushed existing collection: ${process.env.COLLECTION_NAME}`
        );
      } catch (err) {
        console.warn(
          `No existing collection found or delete failed: ${err.message}`
        );
      }
    }

    // collection
    const collection = await chromaClient.getOrCreateCollection({
      name: process.env.COLLECTION_NAME,
    });

    let status;
    if (fileIds && fileIds.length > 0) {
      // Index file tertentu
      status = await indexSelectedFiles(fileIds, collection, geminiEmbeddings);
    } else {
      // Index semua file di folder
      status = await indexSheetsInFolder(
        process.env.GOOGLE_DRIVE_DIR_ID,
        collection,
        geminiEmbeddings
      );
    }

    if (status === 0) {
      return res.status(400).json({
        success: false,
        message: "No spreadsheets found in the specified folder.",
      });
    }

    res.json({
      success: true,
      message: "Documents successfully indexed into Chroma!",
    });
  } catch (err) {
    console.error("Error during POST /sheets", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

export { indexSheets };
