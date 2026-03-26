#!/bin/bash

echo -e "\033[0;32mStarting Expo web development server with cache clearing...\033[0m"
echo -e "\033[0;33mThis will clear Metro bundler cache and start the web platform\033[0m"
echo -e "\033[0;33mNavigate to http://localhost:8081 to verify index.bundle loads successfully\033[0m"
echo ""

cd "$(dirname "$0")/.." || exit 1

echo -e "\033[0;36mRunning: npx expo start --clear --web\033[0m"
npx expo start --clear --web
