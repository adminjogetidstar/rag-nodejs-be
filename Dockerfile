# Stage 1: Build image
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Install dependency build (karena Alpine minimalis)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Salin file dependency dulu biar cache-nya efisien
COPY package*.json ./

# Hanya install production dependencies
RUN npm install

# Salin semua source code
COPY . .

# Stage 2: Final image
FROM node:20-bookworm-slim

WORKDIR /app

# Install runtime dependency (buat jalankan onnxruntime)
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

# Salin hasil build dari tahap pertama
COPY --from=build /app .

EXPOSE 3000

CMD ["npm", "start"]
