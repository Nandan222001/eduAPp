#!/usr/bin/env pwsh

Write-Host "Starting Expo development server with cache clearing..." -ForegroundColor Green
Write-Host "This will clear Metro bundler cache and reset all caches" -ForegroundColor Yellow
Write-Host ""

Set-Location -Path $PSScriptRoot\..

Write-Host "Running: npx expo start --clear --reset-cache" -ForegroundColor Cyan
npx expo start --clear --reset-cache
