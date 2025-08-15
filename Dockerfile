# Use Node.js official image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application with environment variables
# All environment variables must be provided via build args
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_OIDC_AUTHORITY
ARG NEXT_PUBLIC_OIDC_CLIENT_ID
ARG NEXT_PUBLIC_APP_PREFIX
#ARG BUILD_MODE

# Set default values for local testing if not provided
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-https://mol-view-stories-dev.dyn.cloud.e-infra.cz}
ENV NEXT_PUBLIC_OIDC_AUTHORITY=${NEXT_PUBLIC_OIDC_AUTHORITY:-https://login.aai.lifescience-ri.eu/oidc}
ENV NEXT_PUBLIC_OIDC_CLIENT_ID=${NEXT_PUBLIC_OIDC_CLIENT_ID:-3963b643-f862-4578-868e-3ba3de08dd2d}
ENV NEXT_PUBLIC_APP_PREFIX=${NEXT_PUBLIC_APP_PREFIX:-mol-view-stories/}

# Set NODE_ENV to production for proper basePath configuration
ENV NODE_ENV=production

RUN npm run build

# Production image, copy all the files and run nginx
FROM nginxinc/nginx-unprivileged AS runner
WORKDIR /usr/share/nginx/html

# Copy static assets from builder stage (this will overwrite default files)
#COPY --from=builder /app/out .
COPY --from=builder /app/out/. /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]