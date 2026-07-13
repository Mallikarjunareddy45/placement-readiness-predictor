# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package config and lockfile
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend files
COPY frontend/ ./

# Accept build-time environment variables (e.g. backend API endpoints)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Compile production-ready static assets
RUN npm run build

# Production server stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
