#!/bin/bash

# Expo Router Multi-Platform Test Script
# This script tests Expo Router on web, iOS, and Android platforms

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Parse command line arguments
RUN_WEB=false
RUN_IOS=false
RUN_ANDROID=false
RUN_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --web)
            RUN_WEB=true
            shift
            ;;
        --ios)
            RUN_IOS=true
            shift
            ;;
        --android)
            RUN_ANDROID=true
            shift
            ;;
        --all)
            RUN_ALL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--web] [--ios] [--android] [--all]"
            exit 1
            ;;
    esac
done

# If no specific platform specified, run all
if [ "$RUN_WEB" = false ] && [ "$RUN_IOS" = false ] && [ "$RUN_ANDROID" = false ]; then
    RUN_ALL=true
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Expo Router Multi-Platform Test Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Function to test web platform
test_web() {
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}Testing Web Platform${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    
    echo -e "${GREEN}Step 1: Clearing cache and rebuilding...${NC}"
    echo -e "${GRAY}Running: npx expo start --clear${NC}"
    echo ""
    
    echo -e "${CYAN}To test web with cache clear, run:${NC}"
    echo -e "${WHITE}  cd mobile && npx expo start --clear${NC}"
    echo ""
    
    echo -e "${GREEN}Step 2: Testing web build...${NC}"
    echo -e "${GRAY}Running: npx expo start --web${NC}"
    echo ""
    
    echo -e "${CYAN}To test web platform, run:${NC}"
    echo -e "${WHITE}  cd mobile && npx expo start --web${NC}"
    echo ""
    echo -e "${WHITE}Then navigate to: http://localhost:8081${NC}"
    echo ""
    
    echo -e "${MAGENTA}Web Test Checklist:${NC}"
    echo -e "${WHITE}  [ ] Server starts without errors${NC}"
    echo -e "${WHITE}  [ ] Navigate to http://localhost:8081 - page loads without 500 errors${NC}"
    echo -e "${WHITE}  [ ] Navigate to http://localhost:8081/(auth)/login - route works${NC}"
    echo -e "${WHITE}  [ ] Open browser console - check for MIME type errors${NC}"
    echo -e "${WHITE}  [ ] Verify path aliases resolve (no module not found errors)${NC}"
    echo -e "${WHITE}  [ ] Check that native modules are stubbed properly${NC}"
    echo ""
}

# Function to test iOS platform
test_ios() {
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}Testing iOS Platform${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    
    echo -e "${GREEN}Checking for iOS Simulator...${NC}"
    
    # Check if running on macOS (required for iOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${GREEN}macOS detected - iOS testing available${NC}"
        
        echo -e "${CYAN}To test iOS platform, run:${NC}"
        echo -e "${WHITE}  cd mobile && npx expo start --ios${NC}"
        echo ""
        echo -e "${CYAN}Or with cache clear:${NC}"
        echo -e "${WHITE}  cd mobile && npx expo start --clear --ios${NC}"
        echo ""
        
        echo -e "${MAGENTA}iOS Test Checklist:${NC}"
        echo -e "${WHITE}  [ ] App builds successfully${NC}"
        echo -e "${WHITE}  [ ] App launches in simulator without crashes${NC}"
        echo -e "${WHITE}  [ ] Navigate to login screen - route works${NC}"
        echo -e "${WHITE}  [ ] Verify all path aliases resolve${NC}"
        echo -e "${WHITE}  [ ] Check Metro bundler console for errors${NC}"
        echo -e "${WHITE}  [ ] Test deep linking to /(auth)/login${NC}"
        echo ""
    else
        echo -e "${RED}iOS testing requires macOS${NC}"
        echo -e "${YELLOW}Skipping iOS tests...${NC}"
        echo ""
    fi
}

# Function to test Android platform
test_android() {
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}Testing Android Platform${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    
    echo -e "${GREEN}Checking for Android Emulator...${NC}"
    
    # Check if Android SDK is available
    if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
        echo -e "${GREEN}Android SDK detected - Android testing available${NC}"
        
        echo -e "${CYAN}To test Android platform, run:${NC}"
        echo -e "${WHITE}  cd mobile && npx expo start --android${NC}"
        echo ""
        echo -e "${CYAN}Or with cache clear:${NC}"
        echo -e "${WHITE}  cd mobile && npx expo start --clear --android${NC}"
        echo ""
        
        echo -e "${MAGENTA}Android Test Checklist:${NC}"
        echo -e "${WHITE}  [ ] App builds successfully${NC}"
        echo -e "${WHITE}  [ ] App launches in emulator without crashes${NC}"
        echo -e "${WHITE}  [ ] Navigate to login screen - route works${NC}"
        echo -e "${WHITE}  [ ] Verify all path aliases resolve${NC}"
        echo -e "${WHITE}  [ ] Check Metro bundler console for errors${NC}"
        echo -e "${WHITE}  [ ] Test deep linking to /(auth)/login${NC}"
        echo ""
    else
        echo -e "${YELLOW}Android SDK not detected${NC}"
        echo -e "${YELLOW}Set ANDROID_HOME or ANDROID_SDK_ROOT environment variable to enable Android testing${NC}"
        echo ""
        echo -e "${CYAN}To test Android anyway, run:${NC}"
        echo -e "${WHITE}  cd mobile && npx expo start --android${NC}"
        echo ""
    fi
}

# Main execution
if [ "$RUN_ALL" = true ]; then
    test_web
    test_ios
    test_android
else
    if [ "$RUN_WEB" = true ]; then test_web; fi
    if [ "$RUN_IOS" = true ]; then test_ios; fi
    if [ "$RUN_ANDROID" = true ]; then test_android; fi
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Manual Testing Commands${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Clear cache and start:${NC}"
echo -e "${WHITE}  cd mobile && npx expo start --clear${NC}"
echo ""
echo -e "${YELLOW}Web only:${NC}"
echo -e "${WHITE}  cd mobile && npx expo start --web${NC}"
echo ""
echo -e "${YELLOW}iOS only:${NC}"
echo -e "${WHITE}  cd mobile && npx expo start --ios${NC}"
echo ""
echo -e "${YELLOW}Android only:${NC}"
echo -e "${WHITE}  cd mobile && npx expo start --android${NC}"
echo ""
echo -e "${YELLOW}Test navigation to login route:${NC}"
echo -e "${WHITE}  Web: http://localhost:8081/(auth)/login${NC}"
echo -e "${WHITE}  Native: Use deep link - edutrack:///(auth)/login${NC}"
echo ""
echo -e "${YELLOW}Check for MIME type errors:${NC}"
echo -e "${WHITE}  1. Open browser DevTools (F12)${NC}"
echo -e "${WHITE}  2. Go to Console tab${NC}"
echo -e "${WHITE}  3. Look for any MIME type warnings/errors${NC}"
echo -e "${WHITE}  4. Go to Network tab${NC}"
echo -e "${WHITE}  5. Filter by JS files and check Content-Type headers${NC}"
echo ""
