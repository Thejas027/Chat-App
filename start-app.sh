#!/bin/bash

# Chat App Deployment Script
echo "🚀 Starting Chat App..."

# Function to check if port is in use
check_port() {
    local port=$1
    if netstat -an | grep -q ":$port "; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node server.js" || echo "No existing server processes found"
pkill -f "vite" || echo "No existing Vite processes found"

# Wait a moment for processes to clean up
sleep 2

# Check ports
echo "🔍 Checking ports..."
check_port 5001 || exit 1
check_port 5173 || exit 1

# Start backend server
echo "🖥️  Starting backend server..."
cd server
npm install
npm run dev &
SERVER_PID=$!
echo "Backend server started with PID: $SERVER_PID"

# Wait for server to start
sleep 5

# Start frontend client
echo "🌐 Starting frontend client..."
cd ../client
npm install
npm run dev &
CLIENT_PID=$!
echo "Frontend client started with PID: $CLIENT_PID"

# Wait for client to start
sleep 5

echo ""
echo "🎉 Chat App is now running!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5001"
echo ""
echo "To stop the application, press Ctrl+C or run:"
echo "kill $SERVER_PID $CLIENT_PID"
echo ""

# Keep script running and wait for Ctrl+C
trap "echo 'Stopping Chat App...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT
wait
