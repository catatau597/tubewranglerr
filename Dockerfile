FROM node:20-alpine AS base
RUN apk add --no-cache openssl

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

# Generate Prisma Client
RUN npx prisma generate

# Run migrations and seed the database during the build, explicitly passing the DATABASE_URL
RUN touch prisma/database.db
RUN DATABASE_URL="file:./prisma/database.db" npx prisma migrate deploy
RUN DATABASE_URL="file:./prisma/database.db" npx prisma db seed

# Increase memory for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npx next build --webpack

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/database.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the final application files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy the populated database
COPY --from=builder --chown=nextjs:nodejs /app/prisma/database.db ./data/database.db

# Set the correct permission for prerender cache
RUN mkdir -p .next/cache
RUN chown -R nextjs:nodejs .next .next/cache

# Create data directory for SQLite persistence
RUN mkdir -p /app/data
RUN chown nextjs:nodejs /app/data

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and data dir
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Install prisma globally so we can use it in entrypoint script (since standalone build doesn't include devDependencies)
RUN npm install -g prisma@5

# Ensure entrypoint has execution permissions
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Copy necessary files for database management in runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENTRYPOINT ["./entrypoint.sh"]
