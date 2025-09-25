# Stage 1: Build image
FROM node:20-slim AS build

WORKDIR /app

# Install dependency build (karena slim butuh tools tambahan)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Salin file dependency dulu biar cache lebih efisien
COPY package*.json ./

# Install semua dependency (pakai ci biar deterministic)
RUN npm ci

# Salin semua source code
COPY . .

# Jika ada build step (misalnya Typescript / transpile)
# RUN npm run build


# Stage 2: Final image (lebih kecil & aman)
FROM node:20-slim

WORKDIR /app

# Install runtime dependency saja
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Salin hanya file yang dibutuhkan (bukan semuanya)
COPY --from=build /app /app

# Jalankan sebagai user non-root (lebih aman)
RUN useradd -m appuser
USER appuser

EXPOSE 3000

CMD ["npm", "start"]
