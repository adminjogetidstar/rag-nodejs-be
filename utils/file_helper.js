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

  doc.fontSize(22).fillColor("blue").text(`${title}`, { align: "center" });
  doc.moveDown(2);

  const lines = catalogContent.split("\n");

  lines.forEach(line => {
    if (line.startsWith("KATALOG")) {
      doc.moveDown().fontSize(18).fillColor("black").text(line, { align: "center" });
      doc.moveDown();
    } else if (line.startsWith("Daftar Produk:")) {
      doc.moveDown().fontSize(14).fillColor("black").text(line);
      doc.moveDown(0.5);
    } else if (line.match(/^ID Produk/)) {
      doc.fontSize(12).fillColor("black").text(line, { continued: false });
    } else if (line.match(/^\d+\./)) {
      doc.moveDown().fontSize(13).fillColor("black").text(line);
    } else {
      doc.fontSize(11).fillColor("black").text(line);
    }
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};
