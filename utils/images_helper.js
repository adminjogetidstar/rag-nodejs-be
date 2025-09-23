export const fetchImageAsBase64 = async (url) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.error("Error fetching image from URL:", err.message);
    return null;
  }
};