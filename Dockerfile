# Multi-stage Dockerfile for FINOVA Full-Stack Deployment
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native build tools for compiling native C++ addons if needed
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source files
COPY . .

# Build Vite client production bundle
RUN npm run build:client

# Production runner stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install native build tools for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

# Copy built server and client assets
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data

EXPOSE 4000

CMD ["npx", "tsx", "server/src/index.ts"]
