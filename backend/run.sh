#!/bin/bash

# Start backend server
echo "Starting backend server..."
python api.py &
BACKEND_PID=$!

# Wait for a moment to let the backend start
sleep 2

# Change to frontend directory and start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo "Shutting down servers..."
  kill $FRONTEND_PID
  kill $BACKEND_PID
  exit
}

# Trap signals to ensure clean shutdown
trap cleanup SIGINT SIGTERM

# Wait for user to cancel
echo "Both servers are running. Press Ctrl+C to stop."
wait 