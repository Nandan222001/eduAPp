#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const bumpType = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Usage: node version-bump.js [major|minor|patch]');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appJsonPath = path.join(__dirname, '..', 'app.json');

function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  const currentVersion = packageJson.version;
  const newVersion = incrementVersion(currentVersion, bumpType);
  
  packageJson.version = newVersion;
  appJson.expo.version = newVersion;
  
  appJson.expo.ios.buildNumber = String(parseInt(appJson.expo.ios.buildNumber || '1') + 1);
  appJson.expo.android.versionCode = (appJson.expo.android.versionCode || 1) + 1;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  
  console.log(`✓ Version bumped from ${currentVersion} to ${newVersion}`);
  console.log(`✓ iOS build number: ${appJson.expo.ios.buildNumber}`);
  console.log(`✓ Android version code: ${appJson.expo.android.versionCode}`);
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Commit the version bump: git add . && git commit -m "chore: bump version to ' + newVersion + '"');
  console.log('3. Tag the release: git tag v' + newVersion);
  console.log('4. Push changes: git push && git push --tags');
} catch (error) {
  console.error('Error bumping version:', error.message);
  process.exit(1);
}
