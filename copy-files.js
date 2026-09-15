const fs = require('fs');
const path = require('path');

const filesToCopy = [
  'src/data/newPassages.ts',
  'src/data/readingTests.ts',
  'src/data/readingTests_new.ts',
  'src/data/studyWisdom.ts',
  'src/data/cambridgePassages.ts'
];

const baseDir = 'C:/Users/hp/Desktop/mukh4mmadovoriginal';

filesToCopy.forEach(file => {
  const tsPath = path.join(baseDir, file);
  const jsPath = tsPath.replace('.ts', '.js');

  try {
    const content = fs.readFileSync(tsPath, 'utf8');
    fs.writeFileSync(jsPath, content);
    fs.writeFileSync(tsPath, '');
    console.log(`Copied ${file} to ${path.basename(jsPath)}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log('Done!');
