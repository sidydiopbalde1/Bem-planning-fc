# Étape 1 : Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# on passe l'ARG au moment du build
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI

RUN npm run build

# Étape 2 : Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
