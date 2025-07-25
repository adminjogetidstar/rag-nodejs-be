import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
import path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import ExcelJSLoader from "./exceljs_loader.js";

dotenv.config();

const indexFile = async () => {
  const DIR_NAME = process.env.DIR_NAME;

  console.log("📂 Loading PDFs from /uploads folder...");

  // Load semua PDF dari folder uploads/
  const loader = new DirectoryLoader(path.join(process.cwd(), DIR_NAME), {
    ".pdf": (path) => new PDFLoader(path, { splitPages: true }),
    ".csv": (path) => new CSVLoader(path),
    ".xlsx": (path) => new ExcelJSLoader(path),
  });

  const docs = await loader.load();

  if (docs.length === 0) {
    console.warn("No documents found to index.");
    return 0;
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const simplifiedDocs = [];

  for (const doc of docs) {
    const filePath = doc.metadata.source;
    const fileName = path.basename(filePath);
    const pageNumber = doc.metadata.loc?.pageNumber;
    const ext = path.extname(fileName).replace(".", "").toLowerCase();

    const chunks = await splitter.createDocuments([doc.pageContent]);

    chunks.forEach((chunk, index) => {
      simplifiedDocs.push({
        pageContent: chunk.pageContent,
        metadata: {
          fileName,
          page: pageNumber,
          chunkIndex: index,
          extension: ext,
          source: pageNumber
            ? `${fileName} - page ${pageNumber} - chunk ${index}`
            : `${fileName} - chunk ${index}`,
          userId: "default",
        },
      });
    });
  }

  console.log(`Loaded ${simplifiedDocs.length} pages from /uploads`);

  // Inisialisasi embeddings
  const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "models/embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Inisialisasi Chroma client
  const chromaClient = new ChromaClient({ baseUrl: process.env.CHROMA_URL });

  // Hapus collection jika sudah ada
  try {
    await chromaClient.deleteCollection({ name: process.env.COLLECTION_NAME });
    console.log(`Flushed existing collection: ${process.env.COLLECTION_NAME}`);
  } catch (err) {
    console.warn(`No existing collection found or delete failed: ${err.message}`);
  }

  // Simpan ke Chroma
  await Chroma.fromDocuments(simplifiedDocs, geminiEmbeddings, {
    collectionName: process.env.COLLECTION_NAME,
    url: process.env.CHROMA_URL,
  });

  console.log("Documents successfully indexed into Chroma!");

  return 1;
};

export default indexFile;
