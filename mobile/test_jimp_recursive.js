const Jimp = require('jimp-compact');
const fs = require('fs');
const path = require('path');

const projectRoot = 'd:/htdocs/edu/mobile';

async function testDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.expo') continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      await testDir(filePath);
      continue;
    }
    if (file.match(/\.(png|jpg|jpeg|bmp|tiff|ico)$/i)) {
      try {
        const buffer = fs.readFileSync(filePath);
        if (buffer.length === 0) {
          console.log(`[EMPTY] ${filePath}`);
          continue;
        }
        await Jimp.read(buffer);
        // console.log(`[OK]    ${filePath} (${buffer.length} bytes)`);
      } catch (err) {
        console.log(`[FAIL]  ${filePath} (${fs.statSync(filePath).size} bytes): ${err.message}`);
      }
    }
  }
}

console.log('Testing ALL images (recursive, excluding node_modules, .git, .expo)...');
testDir(projectRoot).then(() => console.log('Done.'));
