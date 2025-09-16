import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const drive_auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const sheet_auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSpreadsheetsFromFolder(folderId) {
  const drive = google.drive({ version: "v3", auth: drive_auth });

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false  and not name contains '_indexed'`,
    fields: "files(id, name)",
  });

  return res.data.files || [];
}

export async function loadSheetRows(spreadsheetId, fileName, sheetName = "Sheet1") {
  const sheets = google.sheets("v4");

  const res = await sheets.spreadsheets.values.get({
    auth: sheet_auth,
    spreadsheetId,
    range: sheetName,
  });

  const rows = res.data.values || [];
  if (rows.length === 0) return [];

  const headers = rows[0];
  // const indexedColIndex = headers.indexOf("Indexed");
  // if (indexedColIndex === -1) {
  //   throw new Error(`Kolom 'Indexed' tidak ditemukan di ${fileName}`);
  // }

  const docs = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // const alreadyIndexed = row[indexedColIndex] === "YES";
    // if (!alreadyIndexed) {
    const rowData = {};
    headers.forEach((h, idx) => {
      rowData[h] = row[idx] || "";
    });

    docs.push({
      pageContent: JSON.stringify(rowData),
      metadata: {
        fileName,
        page: i + 1,
        extension: "sheet",
        source: `${fileName} - page ${i + 1}`,
        userId: "default",
      },
      spreadsheetId,
      sheetName,
      rowNumber: i + 1,
      // indexedColIndex,
    });
    // }
  }
  return docs;
}

async function markRowsAsIndexed(docs) {
  const sheets = google.sheets("v4");

  for (const d of docs) {
    const colLetter = String.fromCharCode(65 + d.indexedColIndex);
    const range = `${d.sheetName}!${colLetter}${d.rowNumber + 1}`; // +1 karena header
    await sheets.spreadsheets.values.update({
      auth: sheet_auth,
      spreadsheetId: d.spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [["YES"]] },
    });
  }
}

export async function indexDocsInBatches(collection, docs, embedder, batchSize = 50) {
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);

    const texts = batch.map((d) => d.pageContent);
    const embeddings = await embedder.embedDocuments(texts);
    const ids = batch.map(
      (d) => `${d.spreadsheetId}_${d.sheetName}_${d.rowNumber}`
    );
    const metadatas = batch.map((d) => d.metadata);

    await collection.add({
      ids,
      embeddings,
      documents: texts,
      metadatas,
    });

    console.log(`Indexed batch ${i / batchSize + 1} (${batch.length} docs)`);

    // await markRowsAsIndexed(batch);
  }
}

async function indexSheetsInFolder(folderId, collection, embedder) {
  const spreadsheets = await getSpreadsheetsFromFolder(folderId);

  if (spreadsheets.length === 0) {
    console.log("No spreadsheets found in the specified folder.");
    return 0;
  }

  const drive = google.drive({ version: "v3", auth: drive_auth });

  for (const file of spreadsheets) {
    console.log(`Processing: ${file.name}`);
    const docs = await loadSheetRows(file.id, file.name);
    if (docs.length > 0) {
      await indexDocsInBatches(collection, docs, embedder, 5);

      // Rename file setelah indexing selesai
      const newName = file.name.endsWith("_indexed")
        ? file.name
        : `${file.name}_indexed`;

      await drive.files.update({
        fileId: file.id,
        requestBody: { name: newName },
      });
    } else {
      console.log(`No new rows to index in ${file.name}`);
    }
  }

  return 1;
}

export default indexSheetsInFolder;