@echo off
REM Web Development Server Startup Script for Windows

echo ==================================
echo EduTrack Mobile - Web Dev Server
echo ==================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
  echo Error: package.json not found
  echo Please run this script from the mobile folder
  exit /b 1
)

REM Create/check .env file
if not exist ".env" (
  echo Creating .env file...
  copy .env.example .env
  echo .env created from .env.example
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

echo.
echo Starting Expo development server...
echo Web app will be available at: http://localhost:8081
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run with --web and --localhost flags
call npm run start:clear -- --web --localhost

REM If that fails, try alternate command
if errorlevel 1 (
  echo.
  echo Retrying with alternate command...
  call npx expo start --clear --web --localhost
)
