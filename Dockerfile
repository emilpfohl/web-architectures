# --- Stage 1: Frontend build ---
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Backend runtime ---
FROM node:22-alpine AS backend
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
RUN npx prisma generate

# Gleicher Schritt wie im Hetzner-Deploy (.github/workflows/deploy.yml):
# Frontend-Build wird als backend/public/ ausgeliefert (Same-Origin-Deployment).
COPY --from=frontend-build /app/frontend/dist ./public

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
