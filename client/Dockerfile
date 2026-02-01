FROM node:18-slim AS builder

WORKDIR /app

# Copy package.json only (not lock file - regenerate for linux)
COPY package.json ./

# Install all dependencies (including dev for building)
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Start the server using PORT env variable from Railway
CMD serve dist -s -l ${PORT:-3000}
