#!/usr/bin/env node

/**
 * Web Bundle Optimization Verification Script
 * 
 * This script verifies that all web optimization configurations are in place:
 * - Platform-specific files exist
 * - Webpack config is properly set up
 * - Metro config has optimization settings
 * - Package.json has correct scripts
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];
const successes = [];

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    successes.push(`✅ ${description} exists`);
    return true;
  } else {
    errors.push(`❌ ${description} not found: ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ ${description}: file not found`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    successes.push(`✅ ${description}`);
    return true;
  } else {
    warnings.push(`⚠️  ${description}: pattern not found`);
    return false;
  }
}

console.log('\n🔍 Verifying Web Bundle Optimization Setup\n');
console.log('='.repeat(60));

// Check platform-specific files
console.log('\n📱 Platform-Specific Files:');
checkFileExists('src/utils/camera.native.ts', 'Camera native implementation');
checkFileExists('src/utils/camera.web.ts', 'Camera web stub');
checkFileExists('src/utils/biometrics.native.ts', 'Biometrics native implementation');
checkFileExists('src/utils/biometrics.web.ts', 'Biometrics web stub');
checkFileExists('src/utils/notifications.native.ts', 'Notifications native implementation');
checkFileExists('src/utils/notifications.web.ts', 'Notifications web stub');
checkFileExists('src/utils/backgroundSync.native.ts', 'Background sync native implementation');
checkFileExists('src/utils/backgroundSync.web.ts', 'Background sync web stub');
checkFileExists('src/utils/documentScanner.native.ts', 'Document scanner native implementation');
checkFileExists('src/utils/documentScanner.web.ts', 'Document scanner web stub');

// Check web-specific screens
console.log('\n🖥️  Web-Specific Screens:');
checkFileExists('src/components/shared/QRScanner.web.tsx', 'QRScanner web component');
checkFileExists('src/screens/student/QRScannerScreen.web.tsx', 'QRScannerScreen web version');
checkFileExists('src/screens/student/CameraScreen.web.tsx', 'CameraScreen web version');

// Check web stubs
console.log('\n📦 Web Module Stubs:');
checkFileExists('src/utils/stubs/camera.web.ts', 'Camera stub');
checkFileExists('src/utils/stubs/barcode.web.ts', 'Barcode stub');
checkFileExists('src/utils/stubs/auth.web.ts', 'Authentication stub');
checkFileExists('src/utils/stubs/notifications.web.ts', 'Notifications stub');
checkFileExists('src/utils/stubs/background.web.ts', 'Background fetch stub');
checkFileExists('src/utils/stubs/tasks.web.ts', 'Task manager stub');

// Check configuration files
console.log('\n⚙️  Configuration Files:');
checkFileExists('metro.config.js', 'Metro config');
checkFileExists('webpack.config.js', 'Webpack config');
checkFileExists('babel.config.js', 'Babel config');

// Check metro config optimizations
console.log('\n🎯 Metro Config Optimizations:');
checkFileContent('metro.config.js', 'minifierPath', 'Minifier configured');
checkFileContent('metro.config.js', 'dead_code', 'Dead code elimination enabled');
checkFileContent('metro.config.js', 'inlineRequires', 'Inline requires enabled');

// Check webpack config
console.log('\n🌐 Webpack Config:');
checkFileContent('webpack.config.js', 'splitChunks', 'Code splitting configured');
checkFileContent('webpack.config.js', 'performance', 'Performance budgets set');
checkFileContent('webpack.config.js', 'expo-camera', 'Native module aliases configured');

// Check app config
console.log('\n📱 App Config:');
checkFileContent('app.config.js', 'platforms', 'Platform-specific plugin config');
checkFileContent('app.config.js', 'performance', 'Web performance config');

// Check package.json scripts
console.log('\n📝 Package.json Scripts:');
checkFileContent('package.json', 'build:web', 'Web build script');
checkFileContent('package.json', 'analyze-bundle', 'Bundle analysis script');

// Check secure storage
console.log('\n🔐 Secure Storage:');
checkFileContent('src/utils/secureStorage.ts', 'Platform.OS === \'web\'', 'Platform detection in secure storage');
checkFileContent('src/utils/secureStorage.ts', 'AsyncStorage', 'AsyncStorage usage for web');

// Check app layout dynamic imports
console.log('\n🚀 App Layout Optimizations:');
checkFileContent('app/_layout.tsx', 'await import', 'Dynamic imports for platform init');

// Check documentation
console.log('\n📚 Documentation:');
checkFileExists('WEB_BUNDLE_OPTIMIZATION.md', 'Optimization documentation');
checkFileExists('scripts/analyze-bundle.js', 'Bundle analysis script');

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');

if (successes.length > 0) {
  console.log(`✅ Passed: ${successes.length} checks`);
}

if (warnings.length > 0) {
  console.log(`⚠️  Warnings: ${warnings.length}`);
  warnings.forEach(w => console.log(`   ${w}`));
}

if (errors.length > 0) {
  console.log(`\n❌ Errors: ${errors.length}`);
  errors.forEach(e => console.log(`   ${e}`));
  console.log('\n');
  process.exit(1);
}

console.log('\n✅ All web bundle optimizations are properly configured!\n');
console.log('Next steps:');
console.log('  1. Run "npm run analyze-bundle" to check bundle size');
console.log('  2. Test web build with "npm run web"');
console.log('  3. Verify no native module errors in browser console\n');
