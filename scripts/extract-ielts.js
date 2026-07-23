const fs = require('fs');
const path = require('path');

// HTML file paths
const htmlDir = 'C:\\Users\\hp\\Downloads\\Telegram Desktop';
const htmlFiles = [
  'Passage 3.html',
  'R (8).html',
  'R (7).html',
  'P3 Origin of language.html',
  'R (4) (2).html',
  'R.html',
  'R (2).html',
  'R (3).html',
  'R (4).html',
  'R (5).html',
  'R (6).html'
];

function extractPassageData(htmlContent, fileName) {
  const result = {
    fileName,
    passages: [],
    questions: [],
    answers: {}
  };

  // Extract correct answers from JavaScript
  const correctAnswersMatch = htmlContent.match(/const correctAnswers\s*=\s*\{([^}]+)\}/s);
  if (correctAnswersMatch) {
    const answersObjStr = '{' + correctAnswersMatch[1] + '}';
    try {
      result.answers = eval('(' + answersObjStr + ')');
    } catch (e) {
      console.log(`Could not parse answers for ${fileName}`);
    }
  }

  // Extract passage titles and content
  const passageTitleRegex = /<h4>([^<]+)<\/h4>/g;
  const passageSubtitles = htmlContent.match(/<p class="passage-subtitle">([^<]+)<\/p>/g) || [];
  
  let titleMatch;
  let passageIndex = 0;
  while ((titleMatch = passageTitleRegex.exec(htmlContent)) !== null) {
    const title = titleMatch[1].trim();
    const subtitle = passageSubtitles[passageIndex]?.replace(/<[^>]+>/g, '').trim() || '';
    
    result.passages.push({
      title,
      subtitle,
      index: passageIndex + 1
    });
    passageIndex++;
  }

  // Extract paragraphs with labels
  const paraRegex = /<p><span class="para-label">([A-Z])<\/span>\s*&nbsp;([^<]+)<\/p>/g;
  let paraMatch;
  const paragraphs = [];
  while ((paraMatch = paraRegex.exec(htmlContent)) !== null) {
    paragraphs.push({
      label: paraMatch[1],
      text: paraMatch[2].trim()
    });
  }
  
  if (paragraphs.length > 0) {
    result.passages.forEach(p => p.paragraphs = paragraphs);
  }

  // Extract questions
  const tfQuestionRegex = /<div class="tf-question"[^>]*>[\s\S]*?<span class="tf-question-number">(\d+)<\/span><span class="tf-question-text">([^<]+)<\/span>[\s\S]*?<\/div>/g;
  let tfMatch;
  while ((tfMatch = tfQuestionRegex.exec(htmlContent)) !== null) {
    result.questions.push({
      number: parseInt(tfMatch[1]),
      type: 'true-false-not-given',
      prompt: tfMatch[2].trim()
    });
  }

  // Extract multiple choice questions
  const mcqRegex = /<div class="multi-choice-question"[^>]*>[\s\S]*?<p><strong>(\d+)<\/strong>[\s\S]*?([^<]+)<\/p>[\s\S]*?<\/div>/g;
  let mcqMatch;
  while ((mcqMatch = mcqRegex.exec(htmlContent)) !== null) {
    result.questions.push({
      number: parseInt(mcqMatch[1]),
      type: 'multiple-choice',
      prompt: mcqMatch[2].trim()
    });
  }

  return result;
}

function main() {
  const allData = [];

  htmlFiles.forEach(file => {
    const filePath = path.join(htmlDir, file);
    if (fs.existsSync(filePath)) {
      const htmlContent = fs.readFileSync(filePath, 'utf-8');
      const data = extractPassageData(htmlContent, file);
      allData.push(data);
      console.log(`Extracted data from ${file}`);
      console.log(`  - Passages: ${data.passages.length}`);
      console.log(`  - Questions: ${data.questions.length}`);
      console.log(`  - Answers: ${Object.keys(data.answers).length}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  });

  // Save extracted data
  const outputPath = path.join(__dirname, '..', 'extracted-ielts-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`\nExtracted data saved to ${outputPath}`);
}

main();
