// utils/drive_utils.js
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const drive_auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth: drive_auth });

export async function removeIndexedSuffixFromFiles(folderId) {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and name contains '_indexed'`,
      fields: "files(id, name)",
    });

    const files = res.data.files || [];
    let count = 0;

    for (const file of files) {
      if (file.name.endsWith("_indexed")) {
        const newName = file.name.replace(/_indexed$/, "");
        await drive.files.update({
          fileId: file.id,
          requestBody: { name: newName },
        });
        console.log(`Renamed ${file.name} -> ${newName}`);
        count++;
      }
    }

    return count;
  } catch (err) {
    console.error("Error while removing _indexed suffix:", err.message);
    return 0;
  }
}
