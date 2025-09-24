import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const cleanContent = (raw) => {
  return raw
    .replace(/[#*_`>]+/g, "")
    .replace(/\|/g, " ")
    .replace(/--+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

export const generateCatalogPdf = async (content, title) => {
  const dirPath = "./outputs";
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);

  const filePath = path.join(dirPath, `document_${title}.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).fillColor("blue").text(title.toUpperCase(), { align: "center" });
  doc.moveDown(2);

  const cleaned = cleanContent(content);

  cleaned.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      doc.moveDown();
    } else if (/^\d+\. /.test(trimmed)) {
      doc.fontSize(12).fillColor("black").text(trimmed, { indent: 20 });
    } else if (trimmed.endsWith(":")) {
      doc.moveDown(0.5).fontSize(14).fillColor("black").text(trimmed, { underline: true });
    } else {
      doc.fontSize(11).fillColor("black").text(trimmed, { indent: 10 });
    }
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};
