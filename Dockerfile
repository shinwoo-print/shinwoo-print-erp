ARG NODE_VERSION=24.14.0-bookworm-slim

# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund

RUN npx prisma generate


# ============================================================
# Stage 2: Builder
# ============================================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated

COPY . .
RUN DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy" npx prisma generate
# ★ 누락된 shadcn/ui 컴포넌트 자동 추가
RUN npx shadcn@latest add sheet -y -o

ENV NODE_OPTIONS="--max-old-space-size=3072"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ============================================================
# Stage 3: Runner (Production)
# ============================================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=deps    --chown=nextjs:nodejs /app/generated ./generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

RUN mkdir -p /app/public/uploads/designs && \
    chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
