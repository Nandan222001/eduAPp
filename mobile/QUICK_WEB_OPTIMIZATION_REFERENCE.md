# Quick Web Optimization Reference

## 🚀 Quick Commands

```bash
# Verify all optimizations are in place
npm run verify-web-optimization

# Build and analyze web bundle
npm run analyze-bundle

# Run web development server
npm run web

# Build web for production
npm run build:web
```

## ✅ What Was Optimized

### 1. Metro Config (`metro.config.js`)
- ✅ Tree-shaking enabled
- ✅ Dead code elimination
- ✅ Minification with terser
- ✅ Console logs removed in production

### 2. Native Module Exclusion
- ✅ Platform-specific files created (`.native.ts` / `.web.ts`)
- ✅ Web stubs for native modules in `src/utils/stubs/`
- ✅ Webpack aliases to map native modules to stubs
- ✅ Dynamic imports in app layout

### 3. Storage Strategy
- ✅ `AsyncStorage` for web (already implemented correctly)
- ✅ `SecureStore` for iOS/Android
- ✅ Platform detection in `src/utils/secureStorage.ts`

### 4. Code Splitting
- ✅ Webpack configured for chunk splitting
- ✅ LazyScreen component for route-based splitting
- ✅ Dynamic imports for platform initialization

### 5. Performance Budgets
- ✅ 2MB threshold for web bundles
- ✅ Bundle analysis script
- ✅ Automated verification script

## 📊 Bundle Size Target

**Target**: < 2MB  
**Check**: `npm run analyze-bundle`

## 🔍 Native Modules Excluded from Web

The following modules are excluded from web builds:
- expo-camera
- expo-barcode-scanner
- expo-local-authentication
- expo-notifications (push notifications)
- expo-background-fetch
- expo-task-manager
- react-native-image-crop-picker

## 📁 Key Files

### Configuration
- `metro.config.js` - Metro bundler optimization
- `webpack.config.js` - Webpack for web
- `app.config.js` - Expo app configuration
- `babel.config.js` - Babel transpilation

### Platform-Specific Code
- `src/utils/camera.{native,web}.ts`
- `src/utils/biometrics.{native,web}.ts`
- `src/utils/notifications.{native,web}.ts`
- `src/utils/backgroundSync.{native,web}.ts`
- `src/utils/documentScanner.{native,web}.ts`

### Web Stubs
- `src/utils/stubs/` - All native module stubs

### Analysis Tools
- `scripts/analyze-bundle.js` - Bundle size analyzer
- `scripts/verify-web-optimization.js` - Configuration verifier

## 🧪 Testing Checklist

After making changes, verify:

- [ ] Run `npm run verify-web-optimization` - All checks pass
- [ ] Run `npm run web` - App loads without errors
- [ ] Check browser console - No native module errors
- [ ] Test authentication - Works using AsyncStorage
- [ ] Test camera features - Shows web fallback UI
- [ ] Run `npm run analyze-bundle` - Bundle under 2MB

## 💡 Adding New Native Features

When adding features that use native modules:

1. Create platform-specific files:
   ```
   feature.native.ts  (for iOS/Android)
   feature.web.ts     (for web fallback)
   ```

2. Use Platform.OS checks:
   ```typescript
   if (Platform.OS !== 'web') {
     const module = await import('./nativeModule');
   }
   ```

3. Add webpack alias if needed in `webpack.config.js`

4. Test on both platforms

## 📖 Full Documentation

- `WEB_BUNDLE_OPTIMIZATION.md` - Complete optimization guide
- `WEB_OPTIMIZATION_SUMMARY.md` - Implementation summary

## 🎯 Success Criteria

All optimizations are successful when:

✅ `verify-web-optimization` script passes  
✅ Bundle size is under 2MB  
✅ No native module imports in web bundle  
✅ App runs on web without errors  
✅ AsyncStorage works for authentication  
✅ Tree-shaking removes unused code  
✅ Web-specific fallbacks work correctly  
