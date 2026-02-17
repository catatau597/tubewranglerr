# Stage 1: Base image with full dependencies
FROM node:20-alpine AS base
# Instala dependências essenciais para streaming e atualização de ferramentas
RUN apk add --no-cache libc6-compat openssl ffmpeg python3 py3-pip curl \
	&& pip3 install --upgrade pip \
	&& pip3 install --upgrade yt-dlp streamlink
WORKDIR /app
COPY package.json package-lock.json* ./
# Install ALL dependencies, including devDependencies, so we have Prisma CLI and tsx
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production image - This image will contain the full app and node_modules
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl ffmpeg python3 py3-pip curl \
	&& pip3 install --upgrade pip \
	&& pip3 install --upgrade yt-dlp streamlink

ENV NODE_ENV=production
# The DATABASE_URL will point to the volume mount in production
ENV DATABASE_URL=file:/app/data/database.db 

# Copy necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Make entrypoint.sh executable
RUN chmod +x /app/entrypoint.sh

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# The data directory will be mounted as a volume, so we just ensure the user has permissions over the mount point
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
