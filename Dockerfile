# Requires output: 'standalone' in next.config.ts
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Pin pnpm via npm — Corepack on Node 22 can fail resolving pnpm.cjs in Alpine builds
RUN npm install -g pnpm@10.34.5

COPY package.json pnpm-lock.yaml ./
# Workspace file is required when present so pnpm resolves the same graph as local
COPY pnpm-workspace.yaml* ./
RUN pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

RUN npm install -g pnpm@10.34.5

# Coolify / compose pass these as build-args; Payload/Next may need them at build time
ARG PAYLOAD_SECRET
ARG DATABASE_URI
ARG NEXT_PUBLIC_SERVER_URL
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
ENV DATABASE_URI=$DATABASE_URI
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public exists (Next standalone expects it; repo may not ship assets yet)
RUN mkdir -p public

RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p .next openapi-uploads vendor-docs-uploads media \
  && chown -R nextjs:nodejs .next openapi-uploads vendor-docs-uploads media

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
