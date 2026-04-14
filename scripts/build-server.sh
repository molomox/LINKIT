
docker network connect app-network $(docker ps --filter "ancestor=linkyt-backend-fqz7hu:latest" --format "{{.Names}}")
docker network connect app-network $(docker ps --filter "ancestor=postgres:18" --format "{{.Names}}")
