const fs = require('fs');
const path = require('path');

const files = [
  'cambridgePassages.ts',
  'newPassages.ts',
  'readingTests.ts',
  'readingTests_new.ts'
];

const dataDir = 'C:\\Users\\hp\\Desktop\\mukh4mmadovoriginal\\src\\data';

files.forEach(file => {
  const tsPath = path.join(dataDir, file);
  const jsPath = path.join(dataDir, file.replace('.ts', '.js'));
  
  let content = fs.readFileSync(tsPath, 'utf8');
  
  // Remove TypeScript-specific syntax
  content = content.replace(/import \{[^}]+\} from "@\/types\/ielts";?\n?/g, '');
  content = content.replace(/: ReadingPassage\[\]/g, '');
  content = content.replace(/: ReadingPassage/g, '');
  content = content.replace(/: ReadingTest\[\]/g, '');
  content = content.replace(/: ReadingTest/g, '');
  content = content.replace(/: QuestionGroup\[\]/g, '');
  content = content.replace(/: QuestionGroup/g, '');
  content = content.replace(/: Question\[\]/g, '');
  content = content.replace(/: Question/g, '');
  content = content.replace(/: Paragraph\[\]/g, '');
  content = content.replace(/: Paragraph/g, '');
  content = content.replace(/: HeadingBank\[\]/g, '');
  content = content.replace(/: HeadingBank/g, '');
  
  // Write to JS file
  fs.writeFileSync(jsPath, content);
  
  // Empty the TS file
  fs.writeFileSync(tsPath, '');
  
  console.log(`Converted ${file} to ${file.replace('.ts', '.js')}`);
});

console.log('All files converted successfully!');
