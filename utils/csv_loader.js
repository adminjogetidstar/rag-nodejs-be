import { Document } from "langchain/document";
import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";

class CSVLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    const raw = await readFile(this.filePath, "utf-8");

    const records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ";",
      trim: true,
    });

    const docs = records.map((row, rowNumber) => {
      return new Document({
        pageContent: JSON.stringify(row),
        metadata: {
          source: this.filePath,
          rowNumber: rowNumber + 1,
        },
      });
    });

    return docs;
  }
}

export default CSVLoader;
