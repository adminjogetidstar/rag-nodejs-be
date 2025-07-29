import ExcelJS from "exceljs";
import { Document } from "langchain/document";

class ExcelJSLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.filePath);

    const docs = [];

    for (const sheet of workbook.worksheets) {
      const sheetDocs = [];
      let headers = [];

      sheet.eachRow((row, rowNumber) => {
        const rowValues = row.values.slice(1); // remove dummy index 0

        if (rowNumber === 1) {
          headers = rowValues;
        } else {
          const headerStr = headers.join(";");
          const rowStr = rowValues.join(";");
          sheetDocs.push(`${headerStr}: ${rowStr}`);
        }
      });

      sheetDocs.forEach((docText, rowNumber) => {
        docs.push(
          new Document({
            pageContent: docText,
            metadata: {
              source: this.filePath,
              sheet: sheet.name,
              rowNumber,
            },
          })
        );
      });
    }

    return docs;
  }
}

export default ExcelJSLoader;
