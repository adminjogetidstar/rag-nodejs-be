import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const drive_auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

export const getDriveFiles = async (req, res) => {
  try {
    const drive = google.drive({ version: "v3", auth: drive_auth });

    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_DIR_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: "files(id, name, mimeType, createdTime, modifiedTime)",
    });
    // testing
    res.json({
      success: true,
      files: response.data.files || [],
    });
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch files from Google Drive",
    });
  }
};
