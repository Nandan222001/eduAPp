#!/bin/bash

echo -e "\033[0;32mStarting Expo development server with cache clearing...\033[0m"
echo -e "\033[0;33mThis will clear Metro bundler cache and reset all caches\033[0m"
echo ""

cd "$(dirname "$0")/.." || exit 1

echo -e "\033[0;36mRunning: npx expo start --clear --reset-cache\033[0m"
npx expo start --clear --reset-cache
