@echo off
REM Android Development Build Script
REM This script clears caches and rebuilds the development app for Android

echo ========================================
echo EduTrack Mobile - Android Dev Build
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
  echo Error: package.json not found
  echo Please run this script from the mobile folder
  exit /b 1
)

REM Colors and formatting
setlocal enabledelayedexpansion

echo [1/5] Clearing Metro bundler cache...
if exist ".expo" rmdir /s /q ".expo" >nul 2>&1
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" >nul 2>&1
echo ✓ Metro cache cleared

echo.
echo [2/5] Clearing Android gradual cache...
cd android
if exist "app\build" rmdir /s /q "app\build" >nul 2>&1
call gradlew.bat clean >nul 2>&1
cd ..
echo ✓ Android build cache cleared

echo.
echo [3/5] Installing dependencies...
call npm install >nul 2>&1
echo ✓ Dependencies installed

echo.
echo [4/5] Starting development server...
echo.
echo Dev server starting on port 8081...
echo Waiting for bundler to prepare...
echo.

REM Start the dev server in background
start "EduTrack Dev Server" npx expo start --clear --reset-cache

echo [5/5] Building development app for Android...
echo.
echo This will:
echo - Compile the latest code
echo - Bundle all assets
echo - Create APK for Android emulator/device
echo.
echo Please wait (this may take 2-5 minutes)...
echo.

REM Wait a moment for server to start
timeout /t 5 /nobreak >nul

REM Build the app
npx expo run:android --clear

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo If you see errors about assets:
echo 1. Check your Android device/emulator is running
echo 2. Verify all assets in assets/ folder exist
echo 3. Run this script again with --verbose for more details
echo.
echo To view logs while app runs:
echo   adb logcat | findstr "assets"
echo.
pause
