# eLearning Camp Monorepo

This monorepo contains the full-stack application for the eLearning Camp platform.

## Project Structure

```
/eLearning-Camp/
│
├── backend/        # Node.js/Express API
├── frontend/       # React frontend (coming soon)
├── package.json    # Root package.json
├── pnpm-workspace.yaml
└── turbo.json     # Turborepo configuration
```

## Prerequisites

- Node.js >= 18
- pnpm >= 8.0.0

## Getting Started

1. Install pnpm if you haven't already:
```bash
npm install -g pnpm
```

2. Install dependencies:
```bash
pnpm install
```

3. Start development servers:
```bash
# Run both frontend and backend in development mode
pnpm dev

# Run only backend
pnpm dev --filter backend
```

## Available Scripts

- `pnpm dev` - Start all packages in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across packages
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all builds and node_modules

## Package Documentation

- [Backend Documentation](./backend/README.md)
- Frontend Documentation (coming soon)


## Deployment with Docker

### Build Images

From the repository root, build the frontend and backend images:

```bash
docker build -f frontend/Dockerfile -t elearning-frontend:prod .
docker build -f backend/Dockerfile -t elearning-backend:prod .
```

### Run with Docker Compose

Use the included `docker-compose.yml` to run both services:

```bash
# For development profile
docker compose --profile dev up --build

# For production profile
docker compose --profile prod up --build
```

### Environment Variables

- Copy `backend/.env.example` to `backend/.env` and fill in your secrets and configuration.
- Never commit secrets to version control. The `.env` file is gitignored.

## License

MIT - See [LICENSE](./backend/LICENSE) for details.