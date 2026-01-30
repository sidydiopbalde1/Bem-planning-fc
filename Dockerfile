# ============================================
# Dockerfile pour BEM Planning FC
# Next.js 15 + Prisma + PostgreSQL
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copier les fichiers de dependances
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installer les dependances
RUN npm ci --legacy-peer-deps

# Generer le client Prisma
RUN npx prisma generate

# ============================================
# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copier les dependances du stage precedent
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de l'application (sans turbopack pour la prod)
RUN npm run build || (cat .next/build-error.log 2>/dev/null; exit 1)

# ============================================
# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Installer openssl pour Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Creer un utilisateur non-root pour la securite
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers necessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Configurer les permissions pour le cache Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copier le build standalone si disponible, sinon le build classique
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copier uniquement Prisma client (non inclus dans le standalone)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 10000

ENV PORT=10000
ENV HOSTNAME="0.0.0.0"

# Demarrage de l'application (migrations gerees par le backend NestJS)
CMD ["node", "server.js"]
