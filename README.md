# MolViewStories

A framework for building beautiful molecular stories.

Online at https://molstar.org/mol-view-stories.

**When using MolViewStories, please cite**:

Terézia Slanináková, Zachary Charlop‐Powers, Viktoriia Doshchenko, Alexander S Rose, Adam Midlik, Anna Sekuła, Neli Fonseca, Kyle L Morris, Stephen K Burley, Sameer Velankar, Jennifer Fleming, Brinda Vallat, Ludovic Autin, David Sehnal: [MolViewStories: Interactive molecular storytelling](https://doi.org/10.1002/pro.70540), *Protein Science*, 2026; https://doi.org/10.1002/pro.70540.

## Local Development (Quick Start)

### Requirements
- Node.js 20+ (Corepack recommended) for the web app
- Docker (with Docker Compose) for hosting backend locally
- Deno for CLI

### Frontend-only Setup

```bash
pnpm i
pnpm dev:web
```

### Frontend + Backend Setup
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