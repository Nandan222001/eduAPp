#!/bin/bash

# Web Development Server Startup Script

echo "=================================="
echo "EduTrack Mobile - Web Dev Server"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found"
  echo "Please run this script from the mobile folder"
  exit 1
fi

# Create/check .env file
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo ".env created from .env.example"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo ""
echo "Starting Expo development server..."
echo "Web app will be available at: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Clear cache and start
npm run start:clear -- --web --localhost

# If that fails, try the standard start
if [ $? -ne 0 ]; then
  echo ""
  echo "Retrying with standard start command..."
  npx expo start --clear --web --localhost
fi
