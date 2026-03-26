#!/usr/bin/env node

/**
 * Verification script for Expo development server
 * This script checks if the server is running and accessible
 */

const http = require('http');

const DEV_SERVER_PORT = 8081;
const DEV_SERVER_HOST = 'localhost';

async function checkServer(port, host) {
  return new Promise((resolve) => {
    const options = {
      host,
      port,
      path: '/status',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        resolve({ running: true, port, host });
      } else {
        resolve({ running: false, port, host });
      }
    });

    req.on('error', () => {
      resolve({ running: false, port, host });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ running: false, port, host });
    });

    req.end();
  });
}

async function checkWebBundle() {
  return new Promise((resolve) => {
    const options = {
      host: DEV_SERVER_HOST,
      port: DEV_SERVER_PORT,
      path: '/index.bundle?platform=web',
      method: 'HEAD',
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve({ available: true, status: res.statusCode });
      } else {
        resolve({ available: false, status: res.statusCode });
      }
    });

    req.on('error', (error) => {
      resolve({ available: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ available: false, error: 'Request timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('Verifying Expo Development Server...\n');

  console.log(`Checking server on ${DEV_SERVER_HOST}:${DEV_SERVER_PORT}...`);
  const serverCheck = await checkServer(DEV_SERVER_PORT, DEV_SERVER_HOST);

  if (serverCheck.running) {
    console.log('✓ Development server is running');
    console.log(`  URL: http://${serverCheck.host}:${serverCheck.port}\n`);

    console.log('Checking web bundle availability...');
    const bundleCheck = await checkWebBundle();

    if (bundleCheck.available) {
      console.log('✓ Web bundle is accessible');
      console.log(`  Status: ${bundleCheck.status}`);
      console.log(`  URL: http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}/index.bundle?platform=web\n`);
      console.log('✓ All checks passed!');
      process.exit(0);
    } else {
      console.log('✗ Web bundle is not accessible');
      if (bundleCheck.error) {
        console.log(`  Error: ${bundleCheck.error}`);
      } else if (bundleCheck.status) {
        console.log(`  Status: ${bundleCheck.status}`);
      }
      console.log('\nThe server is running but the bundle is not ready yet.');
      console.log('This is normal if the server was just started.');
      console.log('Try accessing the bundle again in a moment.');
      process.exit(1);
    }
  } else {
    console.log('✗ Development server is not running');
    console.log(`\nTo start the server with cache clearing:`);
    console.log(`  npx expo start --clear --reset-cache`);
    console.log(`\nOr use npm scripts:`);
    console.log(`  npm run start:clear        # Mobile`);
    console.log(`  npm run start:web:clear    # Web`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
