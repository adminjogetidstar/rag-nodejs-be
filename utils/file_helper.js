import PDFDocument from "pdfkit";
import fs from "fs"
export const generateCatalogPdf = async (catalogContent, title) => {
  const doc = new PDFDocument({ margin: 40 });
  const filePath = `./outputs/catalog_${title}.pdf`;
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

  return filePath;
};
