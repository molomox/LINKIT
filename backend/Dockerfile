# Dockerfile Backend Rust

# Étape 1 : Builder - Compilation de l'application
FROM rust:latest as builder

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail
WORKDIR /app

# Copier d'abord uniquement les fichiers de dépendances
COPY Cargo.toml Cargo.lock ./

# Créer un build factice pour cacher les dépendances
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Maintenant copier le vrai code source
COPY . .

# Compiler l'application réelle en mode release
RUN cargo build --release

# Étape 2 : Runtime - Image légère pour l'exécution
FROM debian:bookworm-slim

# Installer les dépendances runtime
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root
RUN useradd -m -u 1000 appuser

# Définir le répertoire de travail
WORKDIR /app

# Copier le binaire compilé depuis l'étape builder
COPY --from=builder /app/target/release/app /app/app

# Changer le propriétaire
RUN chown -R appuser:appuser /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Commande de démarrage
CMD ["./app"]
