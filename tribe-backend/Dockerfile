# ─── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# System deps needed by native modules (bcrypt uses node-gyp)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Install dependencies first (layer-cached unless lockfile changes).
# postinstall runs `prisma generate` automatically here.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# next build needs these at build time for CORS header generation
ARG CORS_ORIGIN
ENV CORS_ORIGIN=${CORS_ORIGIN}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 2: runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Copy Prisma schema + migrations so `prisma migrate deploy` can run at startup.
# The Prisma client itself is already embedded inside the standalone output.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy the entrypoint script and make it executable
COPY --from=builder --chown=nextjs:nodejs /app/scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Also copy the prisma CLI binary so the runner can call `npx prisma migrate deploy`
# without needing the full node_modules tree.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma            ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma                 ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client         ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines        ./node_modules/@prisma/engines

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# entrypoint.sh runs `prisma migrate deploy` then `exec node server.js`
CMD ["sh", "./entrypoint.sh"]
