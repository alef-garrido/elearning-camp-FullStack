
# 1. Use official Node.js LTS Alpine image for smaller size
FROM node:18-alpine AS deps

# 2. Install pnpm
RUN npm install -g pnpm@latest

# 3. Set workdir to /app (repo root)
WORKDIR /app

# 4. Copy workspace files and backend sources
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/ ./backend/

# 5. Install dependencies for all workspaces
RUN pnpm install --prod --filter ./backend...

# 6. Build production image
FROM node:18-alpine AS prod
WORKDIR /app/backend




# 7. Copy the entire monorepo (repo root) from build stage
COPY --from=deps /app /app

# 8. Expose backend port
EXPOSE 5000

# 9. Start backend server
CMD [ "node", "server.js" ]
