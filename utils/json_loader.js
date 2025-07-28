import fs from "fs";
import { Document } from "langchain/document";

class JSONLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    const raw = fs.readFileSync(this.filePath, "utf8");
    const data = JSON.parse(raw);
    const docs = [];

    // Jika data adalah array of objects
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        docs.push(
          new Document({
            pageContent: JSON.stringify(item, null, 2),
            metadata: {
              source: this.filePath,
              rowNumber: index + 1,
            },
          })
        );
      });
    } else {
      // Jika hanya 1 object
      docs.push(
        new Document({
          pageContent: JSON.stringify(data, null, 2),
          metadata: {
            source: this.filePath,
            rowNumber: 1,
          },
        })
      );
    }

    return docs;
  }
}

export default JSONLoader;
