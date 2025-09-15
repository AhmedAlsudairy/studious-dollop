#!/bin/bash

# Books App - One Command Startup Script
# Usage: ./start.sh [dev|prod]

set -e

APP_NAME="books-app"
MODE=${1:-prod}

echo "🚀 Starting Books App in $MODE mode..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down..."
    if [ "$MODE" = "dev" ]; then
        docker-compose down
    else
        docker-compose -f docker-compose.prod.yml down
    fi
}

trap cleanup EXIT

# Build and start the application
if [ "$MODE" = "dev" ]; then
    echo "📦 Starting in development mode..."
    docker-compose up --build
else
    echo "🏭 Starting in production mode..."
    
    # Build the application
    echo "🔨 Building application..."
    docker-compose -f docker-compose.prod.yml build
    
    # Start the services
    echo "🌟 Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "✅ Application started successfully!"
    echo ""
    echo "📱 Access your app at: http://localhost:3000"
    echo "🗄️  Database: postgresql://user:password@localhost:5432/book_db"
    echo ""
    echo "📊 View logs with: docker-compose -f docker-compose.prod.yml logs -f"
    echo "🛑 Stop with: docker-compose -f docker-compose.prod.yml down"
    echo ""
    
    # Follow logs
    echo "📋 Following application logs (Ctrl+C to stop logs, app keeps running):"
    docker-compose -f docker-compose.prod.yml logs -f app
fi