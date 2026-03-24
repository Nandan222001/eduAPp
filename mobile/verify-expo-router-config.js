#!/usr/bin/env node

/**
 * Expo Router Configuration Verification Script
 * This script verifies that all necessary configuration files are properly set up
 * for Expo Router to work across all platforms (Web, iOS, Android)
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let hasErrors = false;
let hasWarnings = false;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
  hasErrors = true;
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
  hasWarnings = true;
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function section(title) {
  log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Check if file exists
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    success(`${description} exists`);
    return true;
  } else {
    error(`${description} not found: ${filePath}`);
    return false;
  }
}

// Check babel.config.js
function checkBabelConfig() {
  section('Checking babel.config.js');
  
  const babelPath = path.join(process.cwd(), 'babel.config.js');
  if (!checkFileExists(babelPath, 'babel.config.js')) return;
  
  try {
    const babelConfig = require(babelPath);
    const config = typeof babelConfig === 'function' 
      ? babelConfig({ cache: () => {} }) 
      : babelConfig;
    
    // Check for module-resolver plugin
    const hasModuleResolver = config.plugins?.some(plugin => {
      const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
      return pluginName === 'module-resolver' || pluginName.includes('module-resolver');
    });
    
    if (hasModuleResolver) {
      success('module-resolver plugin configured');
      
      // Check path aliases
      const moduleResolverConfig = config.plugins.find(plugin => {
        const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
        return pluginName === 'module-resolver' || pluginName.includes('module-resolver');
      });
      
      if (Array.isArray(moduleResolverConfig) && moduleResolverConfig[1]?.alias) {
        const aliases = moduleResolverConfig[1].alias;
        const expectedAliases = [
          '@components', '@screens', '@store', '@utils', '@config',
          '@types', '@api', '@hooks', '@services', '@constants', '@theme'
        ];
        
        expectedAliases.forEach(alias => {
          if (aliases[alias]) {
            success(`Path alias '${alias}' configured`);
          } else {
            warning(`Path alias '${alias}' not configured`);
          }
        });
      }
    } else {
      error('module-resolver plugin not configured');
    }
    
    // Check for reanimated plugin
    const hasReanimated = config.plugins?.some(plugin => {
      const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
      return pluginName === 'react-native-reanimated/plugin';
    });
    
    if (hasReanimated) {
      success('react-native-reanimated/plugin configured');
    } else {
      warning('react-native-reanimated/plugin not configured');
    }
  } catch (err) {
    error(`Failed to parse babel.config.js: ${err.message}`);
  }
}

// Check metro.config.js
function checkMetroConfig() {
  section('Checking metro.config.js');
  
  const metroPath = path.join(process.cwd(), 'metro.config.js');
  if (!checkFileExists(metroPath, 'metro.config.js')) return;
  
  try {
    const metroContent = fs.readFileSync(metroPath, 'utf8');
    
    // Check for MIME type configuration
    if (metroContent.includes('enhanceMiddleware')) {
      success('Metro middleware configured');
    } else {
      warning('Metro middleware not configured (may cause MIME type issues)');
    }
    
    // Check for extraNodeModules
    if (metroContent.includes('extraNodeModules')) {
      success('extraNodeModules configured');
    } else {
      warning('extraNodeModules not configured');
    }
    
    // Check for source extensions
    if (metroContent.includes('sourceExts')) {
      success('Source extensions configured');
    } else {
      info('Source extensions using defaults');
    }
    
    // Check for asset extensions
    if (metroContent.includes('assetExts')) {
      success('Asset extensions configured');
    } else {
      info('Asset extensions using defaults');
    }
  } catch (err) {
    error(`Failed to read metro.config.js: ${err.message}`);
  }
}

// Check tsconfig.json
function checkTsConfig() {
  section('Checking tsconfig.json');
  
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (!checkFileExists(tsconfigPath, 'tsconfig.json')) return;
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    if (tsconfig.compilerOptions?.paths) {
      success('Path mappings configured in tsconfig.json');
      
      const expectedPaths = [
        '@components', '@screens', '@store', '@utils', '@config',
        '@types', '@api', '@hooks', '@services', '@constants', '@theme'
      ];
      
      expectedPaths.forEach(alias => {
        if (tsconfig.compilerOptions.paths[alias] || 
            tsconfig.compilerOptions.paths[`${alias}/*`]) {
          success(`TypeScript path '${alias}' configured`);
        } else {
          warning(`TypeScript path '${alias}' not configured`);
        }
      });
    } else {
      warning('No path mappings in tsconfig.json');
    }
    
    if (tsconfig.compilerOptions?.baseUrl) {
      success(`Base URL set to: ${tsconfig.compilerOptions.baseUrl}`);
    } else {
      warning('Base URL not set in tsconfig.json');
    }
  } catch (err) {
    error(`Failed to parse tsconfig.json: ${err.message}`);
  }
}

// Check webpack.config.js (for web)
function checkWebpackConfig() {
  section('Checking webpack.config.js (Web Support)');
  
  const webpackPath = path.join(process.cwd(), 'webpack.config.js');
  if (!checkFileExists(webpackPath, 'webpack.config.js')) {
    warning('webpack.config.js not found (web build may not work)');
    return;
  }
  
  try {
    const webpackContent = fs.readFileSync(webpackPath, 'utf8');
    
    // Check for native module stubs
    if (webpackContent.includes('resolve.alias')) {
      success('Webpack aliases configured');
    } else {
      warning('Webpack aliases not configured');
    }
    
    if (webpackContent.includes('.web.ts') || webpackContent.includes('stubs')) {
      success('Native module web stubs configured');
    } else {
      warning('Native module web stubs may not be configured');
    }
  } catch (err) {
    error(`Failed to read webpack.config.js: ${err.message}`);
  }
}

// Check web stubs
function checkWebStubs() {
  section('Checking Web Stubs for Native Modules');
  
  const stubsDir = path.join(process.cwd(), 'src', 'utils', 'stubs');
  
  if (!fs.existsSync(stubsDir)) {
    error('Web stubs directory not found: src/utils/stubs');
    return;
  }
  
  success('Web stubs directory exists');
  
  const requiredStubs = [
    'camera.web.ts',
    'barcode.web.ts',
    'auth.web.ts',
    'notifications.web.ts',
    'background.web.ts',
    'tasks.web.ts',
    'imagePicker.web.ts',
  ];
  
  requiredStubs.forEach(stub => {
    const stubPath = path.join(stubsDir, stub);
    if (fs.existsSync(stubPath)) {
      success(`Stub file exists: ${stub}`);
    } else {
      warning(`Stub file missing: ${stub}`);
    }
  });
}

// Check app directory structure
function checkAppStructure() {
  section('Checking App Directory Structure');
  
  const appDir = path.join(process.cwd(), 'app');
  if (!checkFileExists(appDir, 'app directory')) return;
  
  // Check for _layout.tsx
  checkFileExists(
    path.join(appDir, '_layout.tsx'),
    'Root layout (app/_layout.tsx)'
  );
  
  // Check for auth group
  const authDir = path.join(appDir, '(auth)');
  if (fs.existsSync(authDir)) {
    success('Auth group directory exists');
    checkFileExists(
      path.join(authDir, 'login.tsx'),
      'Login screen (app/(auth)/login.tsx)'
    );
  } else {
    warning('Auth group directory not found');
  }
  
  // Check for tabs group
  const tabsDir = path.join(appDir, '(tabs)');
  if (fs.existsSync(tabsDir)) {
    success('Tabs group directory exists');
  } else {
    warning('Tabs group directory not found');
  }
  
  // Check for +html.tsx (web)
  if (fs.existsSync(path.join(appDir, '+html.tsx'))) {
    success('Web HTML configuration exists (+html.tsx)');
  } else {
    info('Web HTML configuration not found (optional)');
  }
}

// Check package.json
function checkPackageJson() {
  section('Checking package.json');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!checkFileExists(packagePath, 'package.json')) return;
  
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for expo-router
    if (pkg.dependencies?.['expo-router']) {
      success(`expo-router installed: ${pkg.dependencies['expo-router']}`);
    } else {
      error('expo-router not installed');
    }
    
    // Check for main entry point
    if (pkg.main === 'expo-router/entry' || pkg.main === 'index.js') {
      success(`Main entry point: ${pkg.main}`);
    } else {
      warning(`Main entry point may be incorrect: ${pkg.main}`);
    }
    
    // Check scripts
    if (pkg.scripts?.start) {
      success('Start script configured');
    }
    if (pkg.scripts?.web) {
      success('Web script configured');
    }
    if (pkg.scripts?.ios) {
      success('iOS script configured');
    }
    if (pkg.scripts?.android) {
      success('Android script configured');
    }
  } catch (err) {
    error(`Failed to parse package.json: ${err.message}`);
  }
}

// Check app.config.js
function checkAppConfig() {
  section('Checking app.config.js');
  
  const appConfigPath = path.join(process.cwd(), 'app.config.js');
  const appJsonPath = path.join(process.cwd(), 'app.json');
  
  if (fs.existsSync(appConfigPath)) {
    success('app.config.js exists');
    
    try {
      const config = require(appConfigPath);
      const appConfig = typeof config === 'function' ? config({}) : config;
      
      if (appConfig.scheme) {
        success(`Deep link scheme configured: ${appConfig.scheme}`);
      } else {
        warning('Deep link scheme not configured');
      }
      
      if (appConfig.web?.bundler === 'metro') {
        success('Web bundler set to Metro');
      } else {
        info('Web bundler setting not found (using default)');
      }
    } catch (err) {
      error(`Failed to parse app.config.js: ${err.message}`);
    }
  } else if (fs.existsSync(appJsonPath)) {
    warning('Using app.json instead of app.config.js');
  } else {
    error('No app.config.js or app.json found');
  }
}

// Main execution
function main() {
  log('\n' + colors.bold + colors.cyan + 
      '╔════════════════════════════════════════════════════════════╗' + 
      colors.reset);
  log(colors.bold + colors.cyan + 
      '║   Expo Router Configuration Verification                  ║' + 
      colors.reset);
  log(colors.bold + colors.cyan + 
      '╚════════════════════════════════════════════════════════════╝' + 
      colors.reset);
  
  checkPackageJson();
  checkAppConfig();
  checkBabelConfig();
  checkMetroConfig();
  checkTsConfig();
  checkWebpackConfig();
  checkWebStubs();
  checkAppStructure();
  
  // Summary
  section('Verification Summary');
  
  if (!hasErrors && !hasWarnings) {
    log('\n' + colors.bold + colors.green + 
        '✅ All checks passed! Your Expo Router configuration looks good.' + 
        colors.reset + '\n');
  } else if (!hasErrors) {
    log('\n' + colors.bold + colors.yellow + 
        '⚠️  Configuration looks mostly good, but there are some warnings.' + 
        colors.reset + '\n');
  } else {
    log('\n' + colors.bold + colors.red + 
        '❌ Configuration has errors that need to be fixed.' + 
        colors.reset + '\n');
  }
  
  log(colors.cyan + 'Next steps:' + colors.reset);
  log('1. Fix any errors shown above');
  log('2. Address warnings if necessary');
  log('3. Run: npx expo start --clear');
  log('4. Test on web: npx expo start --web');
  log('5. Test on iOS: npx expo start --ios (macOS only)');
  log('6. Test on Android: npx expo start --android\n');
  
  process.exit(hasErrors ? 1 : 0);
}

main();
