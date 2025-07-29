import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import indexFile from "../utils/index_file.js";

dotenv.config();

// Storage config
const DIR_NAME = process.env.DIR_NAME;

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

const uploadHandler = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const uploadedFiles = req.files.map((file) => file.filename);
    
    const status = await indexFile();
    if (status === 0) {
      return res.status(400).json({
        success: false,
        message: "No documents found to index."
      });
    }

    res.json({
      success: true,
      message: "File uploaded and indexed into Chroma!",
      data: uploadedFiles
    });
  } catch (err) {
    console.error("Error during POST /upload:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

const getUploadedFiles = async (req, res) => {
  try {
    const dir = path.join(process.cwd(), DIR_NAME);

    // Cek apakah folder ada
    if (!fs.existsSync(dir)) {
      return res.status(404).json({
        success: false,
        message: "Upload directory not found."
      });
    }

    // Ambil daftar file
    const files = fs.readdirSync(dir);

    // Ambil query parameter pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedFiles = files.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: "List of uploaded files.",
      data: paginatedFiles,
      pagination: {
        currentPage: page,
        totalItems: files.length,
        totalPages: Math.ceil(files.length / limit),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error("Error during GET /uploads:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
};

export { upload, uploadHandler, getUploadedFiles };