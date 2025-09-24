import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const generateCatalogPdf = async (catalogContent, title) => {
  const dirPath = "./outputs";
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  const filePath = path.join(dirPath, `catalog_${title}.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).fillColor("blue").text(`📘 ${title}`, {
    align: "center",
  });
  doc.moveDown(2);

  doc.fontSize(12).fillColor("black").text(catalogContent, {
    align: "left",
    lineGap: 6,
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};
