import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

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
    res.json({
      success: true,
      message: "File uploaded successfully",
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

export { upload, uploadHandler };