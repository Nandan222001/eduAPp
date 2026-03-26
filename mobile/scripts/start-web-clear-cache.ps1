#!/usr/bin/env pwsh

Write-Host "Starting Expo web development server with cache clearing..." -ForegroundColor Green
Write-Host "This will clear Metro bundler cache and start the web platform" -ForegroundColor Yellow
Write-Host "Navigate to http://localhost:8081 to verify index.bundle loads successfully" -ForegroundColor Yellow
Write-Host ""

Set-Location -Path $PSScriptRoot\..

Write-Host "Running: npx expo start --clear --web" -ForegroundColor Cyan
npx expo start --clear --web
