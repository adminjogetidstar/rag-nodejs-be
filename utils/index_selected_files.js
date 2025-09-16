import { google } from "googleapis";
import { loadSheetRows, indexDocsInBatches } from "./index_google_sheets.js"; // bisa export fungsi tsb dari file lama

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const drive_auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const indexSelectedFiles = async (fileIds, collection, embedder) => {
  const drive = google.drive({ version: "v3", auth: drive_auth });

  for (const fileId of fileIds) {
    const file = await drive.files.get({
      fileId,
      fields: "id, name",
    });

    console.log(`Processing selected: ${file.data.name}`);
    const docs = await loadSheetRows(file.data.id, file.data.name);
    if (docs.length > 0) {
      await indexDocsInBatches(collection, docs, embedder, 5);
    } else {
      console.log(`No new rows to index in ${file.data.name}`);
    }
  }

  return fileIds.length;
};

export default indexSelectedFiles;
