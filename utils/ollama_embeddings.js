import axios from "axios";

export class OllamaEmbeddings {
  constructor(fields = {}) {
    this.model = fields.model;
    this.baseUrl = fields.baseUrl;
  }

  async embedQuery(text) {
    const result = await this.callOllamaEmbedding(text);
    return result;
  }

  async embedDocuments(texts) {
    const embeddings = await Promise.all(texts.map((t) => this.callOllamaEmbedding(t)));
    return embeddings;
  }

  async callOllamaEmbedding(input) {
    const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
      model: this.model,
      prompt: input,
    });

    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }

    throw new Error("Failed to get embedding from Ollama.");
  }
}
