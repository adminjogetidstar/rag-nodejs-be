# Stage 1: Build image
FROM node:20-slim AS build

WORKDIR /app

# Salin file dependency dulu biar cache-nya efisien
COPY package*.json ./

# Hanya install production dependencies
RUN npm install --production

# Salin semua source code
COPY . .

# Stage 2: Final image
FROM node:20-slim

WORKDIR /app

# Salin hasil build dari tahap pertama
COPY --from=build /app .

EXPOSE 3000

CMD ["npm", "start"]
