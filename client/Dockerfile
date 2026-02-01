FROM node:18-slim AS builder

WORKDIR /app

# Build arguments for Vite env vars
ARG VITE_API_URL
ARG VITE_MANUAL_MODE

# Set them as environment variables for the build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MANUAL_MODE=$VITE_MANUAL_MODE

# Copy package.json only (not lock file - regenerate for linux)
COPY package.json ./

# Install all dependencies (including dev for building)
RUN npm install

# Copy source code
COPY . .

# Build the app (will use VITE_* env vars)
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
