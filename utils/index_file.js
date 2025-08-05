import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
import path from "path";
import CSVLoader from "./csv_loader.js";
import ExcelJSLoader from "./exceljs_loader.js";
import JSONLoader from "./json_loader.js";

dotenv.config();

const indexFile = async (filenames, clearAll) => {
  const DIR_NAME = process.env.DIR_NAME;

  console.log(`Loading documents from ${DIR_NAME} folder...`);

  const loader = new DirectoryLoader(path.join(process.cwd(), DIR_NAME), {
    ".pdf": (path) => new PDFLoader(path, { splitPages: true }),
    ".csv": (path) => new CSVLoader(path),
    ".xlsx": (path) => new ExcelJSLoader(path),
    ".json": (path) => new JSONLoader(path),
  });

  const docs = await loader.load();

  if (docs.length === 0) {
    console.warn("No documents found to index.");
    return 0;
  }

  const filteredDocs = docs.filter(doc => filenames.includes(path.basename(doc.metadata.source)));

  const simplifiedDocs = filteredDocs.map((doc) => {
    const filePath = doc.metadata.source;
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).replace(".", "").toLowerCase();
    const pageNumber = doc.metadata.loc?.pageNumber ?? doc.metadata.rowNumber;

    return {
      pageContent: doc.pageContent,
      metadata: {
        fileName,
        page: pageNumber,
        extension: ext,
        source: pageNumber
          ? `${fileName} - page ${pageNumber}`
          : `${fileName}`,
        userId: "default",
      },
    };
  });

  console.log(`Loaded ${simplifiedDocs.length} pages from /uploads`);

  // Inisialisasi Embeddings
  const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "models/embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Inisialisasi Chroma
  const chromaClient = new ChromaClient({ baseUrl: process.env.CHROMA_URL });

  if (clearAll) {
    // Hapus collection jika sudah ada
    try {
      await chromaClient.deleteCollection({ name: process.env.COLLECTION_NAME });
      console.log(`Flushed existing collection: ${process.env.COLLECTION_NAME}`);
    } catch (err) {
      console.warn(`No existing collection found or delete failed: ${err.message}`);
    }
  }

  // Indexing ke Chroma
  await Chroma.fromDocuments(simplifiedDocs, geminiEmbeddings, {
    collectionName: process.env.COLLECTION_NAME,
    url: process.env.CHROMA_URL,
  });

  console.log("Documents successfully indexed into Chroma!");

  return 1;
};

export default indexFile;
