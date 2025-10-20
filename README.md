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

## License

MIT - See [LICENSE](./backend/LICENSE) for details.