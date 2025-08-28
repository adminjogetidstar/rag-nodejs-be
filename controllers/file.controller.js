import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ChromaClient } from "chromadb";
import { FileModel } from "../models/index.js";

dotenv.config();

// Storage config
const DIR_NAME = process.env.DIR_NAME;

// Chroma client
const chromaClient = new ChromaClient({
  host: process.env.CHROMA_HOST,
  port: parseInt(process.env.CHROMA_PORT),
  ssl: process.env.CHROMA_SSL === "true",
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), DIR_NAME);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

const postFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const uploadedFiles = await Promise.all(
      req.files.map((file) => {
        return FileModel.create({
          filename: file.filename,
          filepath: `${DIR_NAME}/${file.filename}`
        })
      })
    );

    res.json({
      success: true,
      message: "File uploaded",
      data: uploadedFiles
    });
  } catch (err) {
    console.error("Error during POST /files:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

const getFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const files = await FileModel.findAll({
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: limit
    });

    const totalCount = await FileModel.count();

    res.json({
      success: true,
      message: "List of uploaded files.",
      data: files,
      pagination: {
        currentPage: page,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error("Error during GET /files:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
};

const deleteFiles = async (req, res) => {
  const { fileIds } = req.body;

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

    // Hapus dari direktori
    for (const file of files) {
      const filepath = path.join(process.cwd(), file.filepath);
      const exists = fs.existsSync(filepath);
      if (exists) {
        await fs.promises.rm(filepath);
        console.log(`Deleted file from disk: ${filepath}`);
      } else {
        console.warn(`File not found on disk: ${filepath}`);
      }
    }

    // Hapus dari chroma
    const filenames = files.map(f => f.filename);

    try {
      const collection = await chromaClient.getCollection({ name: process.env.COLLECTION_NAME });
      await collection.delete({
        where: {
          fileName: { "$in": filenames}
        }
      });
      console.log(`Flushed selected documents`);
    } catch (err) {
      console.warn(`No existing collection found or delete failed: ${err.message}`);
    }

    // Hapus dari database
    await FileModel.destroy({
      where: {
        id: fileIds
      }
    });

    res.json({
      success: true,
      message: 'Files deleted successfully.',
      data: {
        deleted: files.length 
      }
    });

  } catch (err) {
    console.error("Error during DELETE /files:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

export { upload, postFiles, getFiles, deleteFiles };