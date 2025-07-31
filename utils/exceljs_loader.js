// exceljs_loader.js
import { Document } from "langchain/document";
import { readFile } from "fs/promises";
import ExcelJS from "exceljs";

class ExcelJSLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    const workbook = new ExcelJS.Workbook();
    const buffer = await readFile(this.filePath);
    await workbook.xlsx.load(buffer);

    const docs = [];

    for (const sheet of workbook.worksheets) {
      const headers = [];
      sheet.eachRow((row, rowNumber) => {
        const values = row.values.slice(1);
        if (rowNumber === 1) {
          headers.push(...values.map(h => String(h).trim()));
        } else {
          const rowObj = {};
          headers.forEach((h, i) => {
            rowObj[h] = values[i] ?? "";
          });

          docs.push(
            new Document({
              pageContent: JSON.stringify(rowObj),
              metadata: {
                source: this.filePath,
                sheetName: sheet.name,
                rowNumber: rowNumber - 1,
              },
            })
          );
        }
      });
    }

    return docs;
  }
}

export default ExcelJSLoader;
