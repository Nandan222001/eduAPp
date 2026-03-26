# Quick Start: Cache Clearing

## TL;DR

```bash
# Start dev server with cache clearing (iOS/Android)
cd mobile
npx expo start --clear --reset-cache

# Start web platform with cache clearing
cd mobile
npx expo start --clear --web
```

## Verification

### Mobile (iOS/Android)
✅ QR code appears in terminal  
✅ No bundling errors  
✅ Server running on exp://[ip]:8081  

### Web
✅ Navigate to http://localhost:8081  
✅ index.bundle loads successfully  
✅ No errors in browser console  

## npm Scripts

```bash
npm run start:clear        # Mobile with cache clearing
npm run start:web:clear    # Web with cache clearing
```

## Shell Scripts

**Windows:**
```powershell
.\scripts\start-dev-clear-cache.ps1   # Mobile
.\scripts\start-web-clear-cache.ps1   # Web
```

**macOS/Linux:**
```bash
./scripts/start-dev-clear-cache.sh    # Mobile
./scripts/start-web-clear-cache.sh    # Web
```

## Full Details

See [CACHE_CLEARING_GUIDE.md](./CACHE_CLEARING_GUIDE.md) for complete documentation.
