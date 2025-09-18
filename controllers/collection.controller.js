import { ChromaClient } from "chromadb";
import fs from "fs";
import path from "path";
import indexFile from "../utils/index_file.js";
import dotenv from "dotenv";
import { FileModel } from "../models/index.js";
import { removeIndexedSuffixFromFiles } from "../utils/drive_helpers.js";

dotenv.config();

// Storage config
const DIR_NAME = process.env.DIR_NAME;

// Inisialisasi Chroma client
const chromaClient = new ChromaClient({
  host: process.env.CHROMA_HOST,
  port: parseInt(process.env.CHROMA_PORT),
  ssl: process.env.CHROMA_SSL === "true",
});

const postCollections = async (req, res) => {
  const { fileIds, clearAll } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    res.status(400).json({
      success: false,
      message: "fileIds is required and must be a non-empty array"
    })
  }

  try {
    // Ambil data dari tables
    const files = await FileModel.findAll({
      where: {
        id: fileIds
      }
    });

    if (files.length === 0) {
      res.status(404).json({
        success: false, message: 'No files found with given IDs'
      });
    }

    // Ambil filenames dari DB untuk di index
    const filenames = files.map(f => f.filename);

    const status = await indexFile(filenames, clearAll);
    if (status === 0) {
      return res.status(400).json({
        success: false,
        message: "No documents found to index."
      });
    }

    // Jika clear all
    if (clearAll) {
      // Ubah indexed menjadi false
      await FileModel.update({
        indexed: false
      }, {
        where: {}
      });
    }

    // Ubah indexed menjadi true untuk id yang dipilih
    await FileModel.update({
      indexed: true
    }, {
      where: {
        id: fileIds
      }
    });

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

    // Ubah indexed menjadi false
    await FileModel.update({
      indexed: false
    }, {
      where: {}
    });

    // Hapus collection jika sudah ada
    try {
      await chromaClient.deleteCollection({ name: process.env.COLLECTION_NAME });
      console.log(`Flushed existing collection: ${process.env.COLLECTION_NAME}`);
    } catch (err) {
      console.warn(`No existing collection found or delete failed: ${err.message}`);
    }

    const renamedCount = await removeIndexedSuffixFromFiles(
      process.env.GOOGLE_DRIVE_DIR_ID
    );
    console.log(`Restored ${renamedCount} files back to original names`);

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