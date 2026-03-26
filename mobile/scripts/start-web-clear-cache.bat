@echo off
echo Starting Expo web development server with cache clearing...
echo This will clear Metro bundler cache and start the web platform
echo Navigate to http://localhost:8081 to verify index.bundle loads successfully
echo.

cd /d "%~dp0\.."

echo Running: npx expo start --clear --web
npx expo start --clear --web
