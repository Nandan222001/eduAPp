const fs = require('fs');
const path = require('path');

const projectRoot = 'd:/htdocs/edu/mobile';

function findSmallFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git') continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findSmallFiles(filePath);
    } else if (stat.size === 11) {
      console.log(`${filePath} (11 bytes)`);
    } else if (stat.size === 0) {
      console.log(`${filePath} (0 bytes)`);
    }
  }
}

console.log('Searching for 0 or 11 byte files...');
findSmallFiles(projectRoot);
console.log('Done.');
