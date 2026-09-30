# syntax=docker/dockerfile:1

# ---------- Stage 1: Build the React/Vite client ----------
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- Stage 2: Install production server deps ----------
FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ---------- Stage 3: Runtime image ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

# Server code + production node_modules
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Built static client (server serves ../../client/dist when present)
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 4000

# Basic container healthcheck against the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/server
CMD ["node", "src/index.js"]
