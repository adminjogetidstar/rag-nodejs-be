import { ChromaClient } from "chromadb";
import fs from "fs";
import path from "path";
import indexFile from "../utils/index_file.js";
import dotenv from "dotenv";

dotenv.config();

// Storage config
const DIR_NAME = process.env.DIR_NAME;

// Inisialisasi Chroma client
const chromaClient = new ChromaClient({ baseUrl: process.env.CHROMA_URL });

const postCollections = async (req, res) => {
  try {
    const status = await indexFile();
    if (status === 0) {
      return res.status(400).json({
        success: false,
        message: "No documents found to index."
      });
    }
    res.json({
      success: true,
      message: "Documents successfully indexed into Chroma!"
    });
  } catch (err) {
    console.error("Error during POST /collections:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

const getCollections = async (req, res) => {
  try {
    const collection = await chromaClient.getOrCreateCollection({ name: process.env.COLLECTION_NAME });
    const results = await collection.get({include: ["documents", "metadatas", "embeddings"]});
    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error during GET /collections:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

const deleteCollections = async (req, res) => {
  const dir = path.join(process.cwd(), DIR_NAME);
  
  try {
    if (!fs.existsSync(dir)) {
      return res.status(404).json({
        success: false,
        message: "Uploads directory does not exist."
      });
    }

    const files = await fs.promises.readdir(dir);

    await Promise.all(
      files.map((file) =>
        fs.promises.unlink(path.join(dir, file))
      )
    );

    // Hapus collection jika sudah ada
    try {
      await chromaClient.deleteCollection({ name: process.env.COLLECTION_NAME });
      console.log(`Flushed existing collection: ${process.env.COLLECTION_NAME}`);
    } catch (err) {
      console.warn(`No existing collection found or delete failed: ${err.message}`);
    }

    res.json({
      success: true,
      message: "Uploads directory cleared."
    });
  } catch (err) {
    console.error("Error during DELETE /collections:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

export { postCollections, getCollections, deleteCollections };