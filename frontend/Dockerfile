# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build static React SPA assets using Node 22 (Alpine)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Cache dependency layer: copy package manifests first
COPY package*.json ./
RUN npm ci

# Copy application source code after dependency installation
COPY . .

# Compile TypeScript and generate Vite production bundle to dist/
RUN npm run build

# ==============================================================================
# Stage 2: Serve static bundle via lightweight Nginx Alpine
# ==============================================================================
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Clean default Nginx configuration and demo files
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy custom Nginx configuration (infrequently changed)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage (frequently changed)
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Graceful HTTP connection draining
STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
