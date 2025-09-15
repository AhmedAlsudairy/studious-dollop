# Books App Makefile
# Simple commands to manage the application

.PHONY: help build start stop restart logs clean dev prod

# Default target
help:
	@echo "📚 Books App Commands:"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make start     - Start the app in production mode"
	@echo "  make dev       - Start the app in development mode"
	@echo ""
	@echo "🔧 Management:"
	@echo "  make build     - Build the Docker images"
	@echo "  make stop      - Stop the application"
	@echo "  make restart   - Restart the application"
	@echo "  make logs      - View application logs"
	@echo "  make clean     - Clean up containers and volumes"
	@echo ""
	@echo "🌐 Access:"
	@echo "  App: http://localhost:3000"
	@echo "  DB:  postgresql://user:password@localhost:5432/book_db"

# Start in production mode
start: prod

# Production mode
prod:
	@echo "🏭 Starting Books App in production mode..."
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "✅ App started at http://localhost:3000"

# Development mode
dev:
	@echo "🛠️  Starting Books App in development mode..."
	docker-compose up --build

# Build images
build:
	@echo "🔨 Building Docker images..."
	docker-compose -f docker-compose.prod.yml build

# Stop the application
stop:
	@echo "🛑 Stopping application..."
	docker-compose -f docker-compose.prod.yml down || docker-compose down

# Restart the application
restart: stop start

# View logs
logs:
	@echo "📋 Viewing application logs..."
	docker-compose -f docker-compose.prod.yml logs -f app || docker-compose logs -f app

# Clean up everything
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans || true
	docker-compose down -v --remove-orphans || true
	docker system prune -f
	@echo "✅ Cleanup complete"

# Quick one-liner to run the app
run: start