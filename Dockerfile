# Multi-stage Dockerfile for FINOVA Full-Stack Deployment
FROM node:20-alpine AS builder

WORKDIR /app

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
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install native dependencies required for better-sqlite3 build
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

# Copy built server and client assets
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data

EXPOSE 4000

CMD ["npx", "tsx", "server/src/index.ts"]
