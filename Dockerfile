# Stage 1: Build image
FROM node:22-bookworm AS build

WORKDIR /app

# Upgrade OS packages dan install build tools
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files dan install Node deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Stage 2: Final image
FROM node:22-bookworm AS final

WORKDIR /app

# Upgrade runtime packages
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y python3 curl \
    && rm -rf /var/lib/apt/lists/*

# Salin hasil build
COPY --from=build /app .

EXPOSE 3000

CMD ["npm", "start"]
