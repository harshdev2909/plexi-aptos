#!/bin/bash

# Plexi Backend Startup Script

echo "🚀 Starting Plexi Vault Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from env.example..."
    cp env.example .env
    echo "📝 Please update .env file with your configuration before running again."
    exit 1
fi

# Check if logs directory exists
if [ ! -d logs ]; then
    echo "📁 Creating logs directory..."
    mkdir -p logs
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "🎯 Starting server..."
npm start
