# ---- Builder ----
FROM node:18-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy package manager files and workspace package.json files to leverage caching
COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the frontend application
RUN pnpm --filter vite_react_shadcn_ts build

# ---- Release ----
FROM nginx:stable-alpine AS release
# Copy built assets from builder
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# Copy nginx configuration from frontend path in repo context
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
