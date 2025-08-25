# Multi-stage build for pnpm monorepo
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy workspace package files
COPY @mol-view-stories/lib/package.json ./@mol-view-stories/lib/
COPY @mol-view-stories/webapp/package.json ./@mol-view-stories/webapp/

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/@mol-view-stories ./@mol-view-stories

# Copy source code
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_OIDC_AUTHORITY
ARG NEXT_PUBLIC_OIDC_CLIENT_ID
ARG NEXT_PUBLIC_APP_PREFIX
ARG NEXT_PUBLIC_RELEASE_VERSION

# Set default values for local testing if not provided
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-https://mol-view-stories-dev.dyn.cloud.e-infra.cz}
ENV NEXT_PUBLIC_OIDC_AUTHORITY=${NEXT_PUBLIC_OIDC_AUTHORITY:-https://login.aai.lifescience-ri.eu/oidc}
ENV NEXT_PUBLIC_OIDC_CLIENT_ID=${NEXT_PUBLIC_OIDC_CLIENT_ID:-3963b643-f862-4578-868e-3ba3de08dd2d}
ENV NEXT_PUBLIC_APP_PREFIX=${NEXT_PUBLIC_APP_PREFIX:-mol-view-stories/}
ENV NEXT_PUBLIC_RELEASE_VERSION=${NEXT_PUBLIC_RELEASE_VERSION:-dev}

# Set NODE_ENV to production for proper basePath configuration
ENV NODE_ENV=production

# Build the webapp
RUN pnpm run --filter=@mol-view-stories/webapp build

# Production image, copy all the files and run nginx
FROM nginxinc/nginx-unprivileged AS runner
WORKDIR /usr/share/nginx/html

# Copy static assets from builder stage
COPY --from=builder /app/@mol-view-stories/webapp/out/. /usr/share/nginx/html/

# Copy nginx configuration
COPY @mol-view-stories/webapp/nginx-dev.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
