const Jimp = require('jimp-compact');
const fs = require('fs');
const path = require('path');

const projectRoot = 'd:/htdocs/edu/mobile';
const assetsDirs = [
  path.join(projectRoot, 'assets'),
  path.join(projectRoot, 'mobile/src/assets'),
];

async function testDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      await testDir(filePath);
      continue;
    }
    if (file.match(/\.(png|jpg|jpeg|bmp|tiff)$/i)) {
      try {
        const buffer = fs.readFileSync(filePath);
        if (buffer.length === 0) {
          console.log(`[EMPTY] ${filePath}`);
          continue;
        }
        await Jimp.read(buffer);
        console.log(`[OK]    ${filePath} (${buffer.length} bytes)`);
      } catch (err) {
        console.log(`[FAIL]  ${filePath} (${fs.statSync(filePath).size} bytes): ${err.message}`);
      }
    }
  }
}

console.log('Testing assets...');
testDir(projectRoot).then(() => console.log('Done.'));
