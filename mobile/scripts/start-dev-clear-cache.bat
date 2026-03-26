@echo off
echo Starting Expo development server with cache clearing...
echo This will clear Metro bundler cache and reset all caches
echo.

cd /d "%~dp0\.."

echo Running: npx expo start --clear --reset-cache
npx expo start --clear --reset-cache
