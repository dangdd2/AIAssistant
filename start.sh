#!/bin/bash

echo "🚀 Starting Ollama Chat App..."
echo ""

# Check if Ollama is running
if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not running!"
    echo "   Start it with: ollama serve"
    echo ""
    read -p "Do you want me to start Ollama? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ollama serve &
        sleep 2
    else
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🎯 Starting services..."
echo ""

# Start proxy in background
echo "Starting CORS proxy..."
node proxy.js &
PROXY_PID=$!

# Wait for proxy to start
sleep 2

# Start React app
echo "Starting React app..."
npm start

# Cleanup on exit
trap "kill $PROXY_PID" EXIT
