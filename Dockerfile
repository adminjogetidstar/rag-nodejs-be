# Gunakan base image Node.js versi LTS
FROM node:20

# Buat direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install semua dependencies (atau hanya prod jika NODE_ENV=production)
RUN npm install

# Salin semua file project ke dalam container
COPY . .

# Ekspose port yang digunakan (ganti jika backend kamu bukan di port 3000)
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]
