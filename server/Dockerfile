# Production image for the API (AWS ECS/App Runner, Railway, Fly.io, ...)
FROM node:22-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY src ./src
COPY scripts ./scripts

USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:${PORT:-5000}/health || exit 1
CMD ["node", "src/server.js"]
