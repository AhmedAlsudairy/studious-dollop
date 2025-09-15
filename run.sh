#!/bin/bash

# Books App - Ultimate One Command Runner
# This script starts the entire Books application with a single command

set -e

APP_NAME="books-app"
CONTAINER_NAME="books-app-container"
DB_CONTAINER_NAME="books-db-container"
NETWORK_NAME="books-network"

echo "📚 Starting Books App..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create network if it doesn't exist
if ! docker network ls | grep -q $NETWORK_NAME; then
    echo "🌐 Creating Docker network..."
    docker network create $NETWORK_NAME
fi

# Start PostgreSQL database
echo "🗄️  Starting database..."
if ! docker ps | grep -q $DB_CONTAINER_NAME; then
    docker run -d \
        --name $DB_CONTAINER_NAME \
        --network $NETWORK_NAME \
        -e POSTGRES_USER=user \
        -e POSTGRES_PASSWORD=password \
        -e POSTGRES_DB=book_db \
        -p 5432:5432 \
        -v books_postgres_data:/var/lib/postgresql/data \
        --restart unless-stopped \
        postgres:14-alpine
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Build and start the application
echo "🔨 Building and starting application..."
docker build -t $APP_NAME .

# Remove existing container if it exists
docker rm -f $CONTAINER_NAME 2>/dev/null || true

# Start the application container
docker run -d \
    --name $CONTAINER_NAME \
    --network $NETWORK_NAME \
    -p 3000:3000 \
    -e DATABASE_URL=postgresql://user:password@$DB_CONTAINER_NAME:5432/book_db \
    -e NODE_ENV=production \
    -e NEXTAUTH_SECRET=your-super-secret-key-change-this \
    -e NEXTAUTH_URL=http://localhost:3000 \
    --restart unless-stopped \
    $APP_NAME

echo "✅ Books App is starting up..."
echo ""
echo "🌟 Application will be available at: http://localhost:3000"
echo "🗄️  Database: postgresql://user:password@localhost:5432/book_db"
echo ""
echo "📊 Check status: docker ps"
echo "📋 View logs: docker logs -f $CONTAINER_NAME"
echo "🛑 Stop app: docker stop $CONTAINER_NAME $DB_CONTAINER_NAME"
echo ""

# Wait a moment for startup
sleep 5

# Check if containers are running
if docker ps | grep -q $CONTAINER_NAME && docker ps | grep -q $DB_CONTAINER_NAME; then
    echo "🎉 Application started successfully!"
    echo "🚀 Opening http://localhost:3000..."
    
    # Try to open in browser (works on most systems)
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open > /dev/null; then
        open http://localhost:3000
    fi
else
    echo "⚠️  There might be an issue. Check logs with: docker logs $CONTAINER_NAME"
fi