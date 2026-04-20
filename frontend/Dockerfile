# Dockerfile Frontend Next.js

# Étape 1 : Dependencies - Installation des dépendances
FROM node:20-slim AS deps

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    libatomic1 libc6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer TOUTES les dépendances (y compris dev pour le build)
RUN npm ci

# Étape 2 : Builder - Build de l'application Next.js
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    libatomic1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG NEXT_PUBLIC_GIPHY_API_KEY
ENV NEXT_PUBLIC_GIPHY_API_KEY=$NEXT_PUBLIC_GIPHY_API_KEY

# Copier les dépendances depuis l'étape deps
COPY --from=deps /app/node_modules ./node_modules

# Copier tous les fichiers sources
COPY . .

# Créer le dossier public s'il n'existe pas
RUN mkdir -p public

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build de l'application
RUN npm run build

# Étape 3 : Runner - Image légère pour l'exécution
FROM node:20-slim AS runner

WORKDIR /app

# Installer netcat pour le healthcheck
RUN apt update && apt install -y netcat-openbsd

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Commande de démarrage
CMD ["node", "server.js"]
