# Expo Router Multi-Platform Test Script
# This script tests Expo Router on web, iOS, and Android platforms

param(
    [switch]$Web,
    [switch]$iOS,
    [switch]$Android,
    [switch]$All
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo Router Multi-Platform Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to mobile directory
Set-Location -Path "mobile"

# Function to test web platform
function Test-Web {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Testing Web Platform" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Step 1: Clearing cache and rebuilding..." -ForegroundColor Green
    Write-Host "Running: npx expo start --clear" -ForegroundColor Gray
    Write-Host ""
    
    # Note: This would normally block, so we'll just document the command
    Write-Host "To test web with cache clear, run:" -ForegroundColor Cyan
    Write-Host "  cd mobile && npx expo start --clear" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Step 2: Testing web build..." -ForegroundColor Green
    Write-Host "Running: npx expo start --web" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "To test web platform, run:" -ForegroundColor Cyan
    Write-Host "  cd mobile && npx expo start --web" -ForegroundColor White
    Write-Host ""
    Write-Host "Then navigate to: http://localhost:8081" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Web Test Checklist:" -ForegroundColor Magenta
    Write-Host "  [ ] Server starts without errors" -ForegroundColor White
    Write-Host "  [ ] Navigate to http://localhost:8081 - page loads without 500 errors" -ForegroundColor White
    Write-Host "  [ ] Navigate to http://localhost:8081/(auth)/login - route works" -ForegroundColor White
    Write-Host "  [ ] Open browser console - check for MIME type errors" -ForegroundColor White
    Write-Host "  [ ] Verify path aliases resolve (no module not found errors)" -ForegroundColor White
    Write-Host "  [ ] Check that native modules are stubbed properly" -ForegroundColor White
    Write-Host ""
}

# Function to test iOS platform
function Test-iOS {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Testing iOS Platform" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Checking for iOS Simulator..." -ForegroundColor Green
    
    # Check if running on macOS (required for iOS)
    if ($IsMacOS) {
        Write-Host "macOS detected - iOS testing available" -ForegroundColor Green
        
        Write-Host "To test iOS platform, run:" -ForegroundColor Cyan
        Write-Host "  cd mobile && npx expo start --ios" -ForegroundColor White
        Write-Host ""
        Write-Host "Or with cache clear:" -ForegroundColor Cyan
        Write-Host "  cd mobile && npx expo start --clear --ios" -ForegroundColor White
        Write-Host ""
        
        Write-Host "iOS Test Checklist:" -ForegroundColor Magenta
        Write-Host "  [ ] App builds successfully" -ForegroundColor White
        Write-Host "  [ ] App launches in simulator without crashes" -ForegroundColor White
        Write-Host "  [ ] Navigate to login screen - route works" -ForegroundColor White
        Write-Host "  [ ] Verify all path aliases resolve" -ForegroundColor White
        Write-Host "  [ ] Check Metro bundler console for errors" -ForegroundColor White
        Write-Host "  [ ] Test deep linking to /(auth)/login" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "iOS testing requires macOS" -ForegroundColor Red
        Write-Host "Skipping iOS tests..." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Function to test Android platform
function Test-Android {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Testing Android Platform" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Checking for Android Emulator..." -ForegroundColor Green
    
    # Check if Android SDK is available
    if ($env:ANDROID_HOME -or $env:ANDROID_SDK_ROOT) {
        Write-Host "Android SDK detected - Android testing available" -ForegroundColor Green
        
        Write-Host "To test Android platform, run:" -ForegroundColor Cyan
        Write-Host "  cd mobile && npx expo start --android" -ForegroundColor White
        Write-Host ""
        Write-Host "Or with cache clear:" -ForegroundColor Cyan
        Write-Host "  cd mobile && npx expo start --clear --android" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Android Test Checklist:" -ForegroundColor Magenta
        Write-Host "  [ ] App builds successfully" -ForegroundColor White
        Write-Host "  [ ] App launches in emulator without crashes" -ForegroundColor White
        Write-Host "  [ ] Navigate to login screen - route works" -ForegroundColor White
        Write-Host "  [ ] Verify all path aliases resolve" -ForegroundColor White
        Write-Host "  [ ] Check Metro bundler console for errors" -ForegroundColor White
        Write-Host "  [ ] Test deep linking to /(auth)/login" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "Android SDK not detected" -ForegroundColor Yellow
        Write-Host "Set ANDROID_HOME or ANDROID_SDK_ROOT environment variable to enable Android testing" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To test Android anyway, run:" -ForegroundColor Cyan
        Write-Host "  cd mobile && npx expo start --android" -ForegroundColor White
        Write-Host ""
    }
}

# Main execution
if ($All -or (!$Web -and !$iOS -and !$Android)) {
    # Run all tests if -All specified or no specific platform specified
    Test-Web
    Test-iOS
    Test-Android
} else {
    if ($Web) { Test-Web }
    if ($iOS) { Test-iOS }
    if ($Android) { Test-Android }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Testing Commands" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Clear cache and start:" -ForegroundColor Yellow
Write-Host "  cd mobile && npx expo start --clear" -ForegroundColor White
Write-Host ""
Write-Host "Web only:" -ForegroundColor Yellow
Write-Host "  cd mobile && npx expo start --web" -ForegroundColor White
Write-Host ""
Write-Host "iOS only:" -ForegroundColor Yellow
Write-Host "  cd mobile && npx expo start --ios" -ForegroundColor White
Write-Host ""
Write-Host "Android only:" -ForegroundColor Yellow
Write-Host "  cd mobile && npx expo start --android" -ForegroundColor White
Write-Host ""
Write-Host "Test navigation to login route:" -ForegroundColor Yellow
Write-Host "  Web: http://localhost:8081/(auth)/login" -ForegroundColor White
Write-Host "  Native: Use deep link - edutrack:///(auth)/login" -ForegroundColor White
Write-Host ""
Write-Host "Check for MIME type errors:" -ForegroundColor Yellow
Write-Host "  1. Open browser DevTools (F12)" -ForegroundColor White
Write-Host "  2. Go to Console tab" -ForegroundColor White
Write-Host "  3. Look for any MIME type warnings/errors" -ForegroundColor White
Write-Host "  4. Go to Network tab" -ForegroundColor White
Write-Host "  5. Filter by JS files and check Content-Type headers" -ForegroundColor White
Write-Host ""

Set-Location -Path ".."
