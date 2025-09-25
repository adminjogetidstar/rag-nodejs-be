# Stage 1: Build image
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Install dependency build
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Salin file dependency dulu biar cache lebih efisien
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Salin semua source code
COPY . .

# Stage 2: Final runtime image
FROM node:20-bookworm-slim

WORKDIR /app

# Install runtime dependency (onnxruntime butuh python)
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy hasil build dari tahap pertama
COPY --from=build /app .

EXPOSE 3000

CMD ["npm", "start"]
