# mol-view-stories

A framework for building beautiful molecular stories.

## Local Development (Quick Start)

### Requirements
- Node.js 16.13+ (Corepack recommended)
- Docker (with Docker Compose)

### Setup
```bash
./setup-local-dev.sh
```

What the script does:
- Installs/activates pnpm via Corepack
- Creates `.env` from `env.example`
- Installs dependencies and builds the project
- Starts the API and MinIO via Docker Compose

### Access
- Web App: http://localhost:3000
- API: http://localhost:5000
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
