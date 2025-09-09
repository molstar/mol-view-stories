#!/bin/bash

# Mol View Stories - Local Development Setup Script
# This script sets up the complete local development environment

set -e  # Exit on any error

echo "🚀 Setting up Mol View Stories local development environment..."


RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Windows (Git Bash)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    IS_WINDOWS=true
    print_warning "Detected Windows environment. Some commands may need adjustment."
else
    IS_WINDOWS=false
fi

# Step 1: Prerequisites Check and Installation
print_status "Step 1: Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16.13+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
print_success "Node.js version: $NODE_VERSION"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

print_success "Docker is installed and running"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please ensure Docker Desktop includes Docker Compose."
    exit 1
fi

print_success "Docker Compose is available"

# Step 2: Setup pnpm
print_status "Step 2: Setting up pnpm package manager..."

# Enable Corepack (recommended approach)
if command -v corepack &> /dev/null; then
    print_status "Enabling Corepack..."
    corepack enable
    print_status "Using pinned pnpm version..."
    corepack use pnpm@10.8.1
    print_success "pnpm setup complete via Corepack"
else
    print_warning "Corepack not available, installing pnpm globally..."
    if command -v npm &> /dev/null; then
        npm install -g pnpm@10.8.1
        print_success "pnpm installed globally"
    else
        print_error "Neither Corepack nor npm available. Cannot install pnpm."
        exit 1
    fi
fi

# Verify pnpm installation
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm installation failed"
    exit 1
fi

PNPM_VERSION=$(pnpm -v)
print_success "pnpm version: $PNPM_VERSION"

# Step 3: Environment Configuration
print_status "Step 3: Setting up environment configuration..."

if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success "Created .env from env.example"
    else
        print_error "env.example not found. Cannot create .env file."
        exit 1
    fi
else
    print_warning ".env already exists, skipping creation"
fi

# Step 4: Install Dependencies
print_status "Step 4: Installing project dependencies..."

print_status "Installing root dependencies..."
pnpm install

print_success "Dependencies installed successfully"

# Step 5: Build Project
print_status "Step 5: Building the project..."

# Ensure environment variables are loaded for the build process
if [ -f ".env" ]; then
    print_status "Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
    print_success "Environment variables loaded"
else
    print_error ".env file not found. Cannot proceed with build."
    exit 1
fi

print_status "Building all packages..."
pnpm run build

print_success "Project built successfully"

# Step 6: Setup API Backend
print_status "Step 6: Setting up API backend with Docker..."

# Check if .env.local exists for Docker Compose
if [ ! -f ".env.local" ]; then
    if [ -f ".env" ]; then
        cp .env .env.local
        print_success "Created .env.local for Docker Compose"
    else
        print_error "No .env file found. Cannot create .env.local for Docker Compose."
        exit 1
    fi
fi

# Build and start API services
print_status "Building API Docker image..."
cd api
docker-compose build

print_status "Starting API and MinIO services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Check if API is responding
print_status "Checking API health..."
if curl -f http://localhost:5000/health &> /dev/null; then
    print_success "API is running and healthy"
else
    print_warning "API health check failed, but services may still be starting up"
fi

# Check if MinIO is responding
print_status "Checking MinIO health..."
if curl -f http://localhost:9000/minio/health/live &> /dev/null; then
    print_success "MinIO is running and healthy"
else
    print_warning "MinIO health check failed, but services may still be starting up"
fi

cd ..

print_success "API backend setup complete"

# Step 7: Final Instructions
echo ""
echo "🎉 Local development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Start the web app development server (REQUIRED):"
echo "     pnpm run dev:web"
echo ""
echo "  2. Access the application:"
echo "     - Web app: http://localhost:3000"
echo "     - API: http://localhost:5000"
echo "     - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "🔧 Useful commands:"
echo "  - Stop API services: cd api && docker-compose down"
echo "  - View API logs: cd api && docker-compose logs -f"
echo "  - Restart API services: cd api && docker-compose restart"
echo "  - Build project: pnpm run build"
echo "  - Run linting: pnpm run prettier:check"
echo ""
echo "📚 Documentation:"
echo "  - API docs: api/API_documentation.md"
echo "  - Project README: README.md"
echo ""
print_success "Setup complete! Happy coding! 🚀"

# Start the web app development server
print_status "Starting web app development server..."
print_warning "Press Ctrl+C to stop the dev server when you're done"
echo ""
pnpm run dev:web