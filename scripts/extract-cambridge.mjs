/**
 * Extracts authentic Cambridge IELTS reading passages from HTML test files
 * and generates src/data/readingTests.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_DIR = "C:\\Users\\hp\\Downloads\\Telegram Desktop";
const OUT_FILE = path.resolve(__dirname, "../src/data/readingTests.ts");

const TEST_FILES = [
  "TEST 1.html",
  "TEST 2.html",
  "TEST 3.html",
  "TEST 4.html",
  "TEST 5.html",
  "TEST 6.html",
  "TEST 7.html",
  "TEST 8.html",
  "TEST 9.html",
  "TEST 10.html",
];

function slugify(title, testNum, passageNum) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `cambridge-test-${testNum}-passage-${passageNum}-${base}`;
}

function stripHtml(html) {
  return html
    .replace(/<sup>(.*?)<\/sup>/gi, (_, t) => t)
    .replace(/<sub>(.*?)<\/sub>/gi, (_, t) => t)
    .replace(/<em>(.*?)<\/em>/gi, (_, t) => t)
    .replace(/<strong>(.*?)<\/strong>/gi, (_, t) => t)
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePassageHtml(html) {
  const titleMatch = html.match(/class="pass-title">([^<]+)/);
  const subMatch = html.match(/class="pass-sub">([^<]+)/);
  const title = titleMatch ? stripHtml(titleMatch[1]) : "Reading Passage";
  const subtitle = subMatch ? stripHtml(subMatch[1]) : undefined;

  const bodyMatch = html.match(/class="pass-body">([\s\S]*?)<\/div>\s*$/);
  const body = bodyMatch ? bodyMatch[1] : html;
  const pMatches = [...body.matchAll(/<p>([\s\S]*?)<\/p>/g)];

  const paragraphs = pMatches.map((m, i) => {
    const raw = m[1];
    const letterMatch = raw.match(/class="para-letter">([A-Z])<\/span>/);
    const label = letterMatch ? letterMatch[1] : String(i + 1);
    const text = stripHtml(raw.replace(/<span class="para-letter">[A-Z]<\/span>/, ""));
    return { label, text };
  });

  const wordCount = paragraphs.reduce((n, p) => n + p.text.split(/\s+/).length, 0);
  return { title, subtitle, paragraphs, wordCount };
}

function extractPassages(content) {
  const passages = {};
  const passMatch = content.match(/const PASSAGES\s*=\s*\{([\s\S]*?)\};\s*\n\s*const AK/);
  if (!passMatch) return passages;

  for (let i = 1; i <= 3; i++) {
    const re = new RegExp(`${i}:\\s*\`([\\s\\S]*?)\`(?:,|\\s*\\})`);
    const m = passMatch[1].match(re);
    if (m) passages[i] = parsePassageHtml(m[1]);
  }
  return passages;
}

function extractAK(content) {
  const akMatch = content.match(/const AK\s*=\s*\{([\s\S]*?)\};/);
  if (!akMatch) return {};
  const ak = {};
  const pairs = akMatch[1].matchAll(/(\d+)\s*:\s*'([^']*)'/g);
  for (const [, num, val] of pairs) {
    let answer = val;
    if (answer === "T") answer = "TRUE";
    else if (answer === "F") answer = "FALSE";
    else if (answer === "NGV") answer = "NOT GIVEN";
    ak[parseInt(num)] = answer;
  }
  return ak;
}

function expandAK(val) {
  if (val === "T") return "TRUE";
  if (val === "F") return "FALSE";
  if (val === "NGV") return "NOT GIVEN";
  return val;
}

function extractHeadingOpts(content, varName) {
  const re = new RegExp(`const ${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
  const m = content.match(re);
  if (!m) return [];
  const opts = [];
  const items = m[1].matchAll(/\{v:'([^']+)',t:'([^']+)'\}/g);
  for (const [, id, text] of items) opts.push({ id, text: text.replace(/\\'/g, "'") });
  return opts;
}

function unescapeJs(s) {
  return s.replace(/\\'/g, "'").replace(/\\"/g, '"');
}

function parseQuestions(content, passageNum) {
  const fnName = `renderQ${passageNum}`;
  const fnMatch = content.match(new RegExp(`function ${fnName}\\(\\)\\{([\\s\\S]*?)\\n\\}`));
  if (!fnMatch) return { groups: [], headingBank: undefined };

  const fnBody = fnMatch[1];
  const groups = [];
  let headingBank = undefined;

  // Extract heading options from any HOPTS variable in this function
  const hoptMatch = fnBody.match(/const (HOPTS\w*)\s*=\s*\[([\s\S]*?)\];/);
  if (hoptMatch) {
    headingBank = [];
    const items = hoptMatch[2].matchAll(/\{v:'([^']+)',t:'([^']+)'\}/g);
    for (const [, id, text] of items) headingBank.push({ id, text: unescapeJs(text) });
  }

  // Split by qs divs for instruction groups
  const instrBlocks = fnBody.split(/<div class="qs">/);
  for (const block of instrBlocks.slice(1)) {
    const instrMatch = block.match(/<div class="qs-instr">([\s\S]*?)<\/div>/);
    const instructions = instrMatch ? stripHtml(instrMatch[1]) : "";
    const questions = [];

    // TFNG
    for (const m of block.matchAll(/tfnBlock\((\d+),'([^']*(?:\\'[^']*)*)'\)/g)) {
      const num = parseInt(m[1]);
      questions.push({
        id: `q${num}`,
        number: num,
        type: "true-false-not-given",
        prompt: unescapeJs(m[2]),
      });
    }

    // fillField
    for (const m of block.matchAll(/fillField\((\d+),'([^']*)','([^']*)'\)/g)) {
      const num = parseInt(m[1]);
      questions.push({
        id: `q${num}`,
        number: num,
        type: "sentence-completion",
        before: unescapeJs(m[2]),
        after: unescapeJs(m[3]),
        maxWords: 3,
      });
    }

    // headingRow
    for (const m of block.matchAll(/headingRow\((\d+),'([A-Z])',HOPTS\w*\)/g)) {
      const num = parseInt(m[1]);
      questions.push({
        id: `q${num}`,
        number: num,
        type: "matching-headings",
        paragraphLabel: `Paragraph ${m[2]}`,
        prompt: `Paragraph ${m[2]}`,
      });
    }

    // matchRow - matching features
    const acadMatch = block.match(/const ACADS=\[([\s\S]*?)\];/);
    let matchOpts = [];
    if (acadMatch) {
      const items = acadMatch[1].matchAll(/\{v:'([^']+)',t:'([^']+)'\}/g);
      for (const [, key, text] of items) matchOpts.push({ key, text: unescapeJs(text) });
    }
    for (const m of block.matchAll(/matchRow\((\d+),'([^']*(?:\\'[^']*)*)',ACADS\)/g)) {
      const num = parseInt(m[1]);
      questions.push({
        id: `q${num}`,
        number: num,
        type: "matching-features",
        prompt: unescapeJs(m[2]),
        options: matchOpts,
      });
    }

    // paraRow
    for (const m of block.matchAll(/paraRow\((\d+),'([^']*(?:\\'[^']*)*)'\)/g)) {
      const num = parseInt(m[1]);
      questions.push({
        id: `q${num}`,
        number: num,
        type: "paragraph-matching",
        prompt: unescapeJs(m[2]),
      });
    }

    // mcqBlock
    for (const m of block.matchAll(/mcqBlock\((\d+),'([^']*(?:\\'[^']*)*)',\{([^}]+)\}\)/g)) {
      const num = parseInt(m[1]);
      const opts = [];
      const optStr = m[3];
      const optItems = optStr.matchAll(/([A-D]):'([^']*(?:\\'[^']*)*)'/g);
      for (const [, key, text] of optItems) opts.push({ key, text: unescapeJs(text) });
      questions.push({
        id: `q${num}`,
        number: num,
        type: "multiple-choice",
        prompt: unescapeJs(m[2]),
        options: opts,
      });
    }

    if (questions.length > 0) {
      questions.sort((a, b) => a.number - b.number);
      groups.push({ instructions, questions });
    }
  }

  return { groups, headingBank };
}

function findEvidence(paragraphs, answer) {
  const searchTerms = answer
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  for (const p of paragraphs) {
    const lower = p.text.toLowerCase();
    if (searchTerms.every((t) => lower.includes(t)) || lower.includes(answer.toLowerCase())) {
      const idx = lower.indexOf(searchTerms[0] || answer.toLowerCase());
      const start = Math.max(0, idx - 40);
      const end = Math.min(p.text.length, idx + answer.length + 120);
      let excerpt = p.text.slice(start, end);
      if (start > 0) excerpt = "..." + excerpt;
      if (end < p.text.length) excerpt = excerpt + "...";
      return { paragraph: p.label, excerpt };
    }
  }
  // Fallback: first paragraph mentioning any search term
  for (const term of searchTerms) {
    for (const p of paragraphs) {
      if (p.text.toLowerCase().includes(term)) {
        return { paragraph: p.label, excerpt: p.text.slice(0, 200) + "..." };
      }
    }
  }
  return { paragraph: paragraphs[0]?.label || "A", excerpt: paragraphs[0]?.text.slice(0, 150) + "..." || "" };
}

function buildExplanation(q, answer, paragraphs) {
  const evidence = findEvidence(paragraphs, answer);
  const base = `The correct answer is "${answer}". Evidence from Paragraph ${evidence.paragraph}: "${evidence.excerpt}"`;

  if (q.type === "true-false-not-given") {
    if (answer === "NOT GIVEN") {
      return `The passage does not provide enough information to confirm or deny this statement. ${base}`;
    }
    return base;
  }
  if (q.type === "matching-headings") {
    return `Paragraph ${q.paragraphLabel?.replace("Paragraph ", "")} best matches heading ${answer}. ${base}`;
  }
  if (q.type === "paragraph-matching") {
    return `The information described is found in Paragraph ${answer}. ${base}`;
  }
  if (q.type === "matching-features") {
    return `This finding is attributed to ${answer}. ${base}`;
  }
  if (q.type === "multiple-choice") {
    const opt = q.options?.find((o) => o.key === answer);
    return `Option ${answer} (${opt?.text || answer}) is correct. ${base}`;
  }
  if (q.type === "sentence-completion") {
    return `The passage supports "${answer}" as the missing word(s). ${base}`;
  }
  return base;
}

function difficultyForPassage(passageNum) {
  if (passageNum === 1) return "Easy";
  if (passageNum === 2) return "Medium";
  return "Hard";
}

function processFile(filename, testNum) {
  const filePath = path.join(HTML_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing: ${filename}`);
    return [];
  }
  const content = fs.readFileSync(filePath, "utf8");
  const passages = extractPassages(content);
  const ak = extractAK(content);
  const results = [];

  for (let pNum = 1; pNum <= 3; pNum++) {
    const passage = passages[pNum];
    if (!passage) continue;

    const { groups, headingBank } = parseQuestions(content, pNum);

    // Attach answers and explanations
    for (const group of groups) {
      for (const q of group.questions) {
        const rawAnswer = ak[q.number];
        if (!rawAnswer) continue;
        q.answer = rawAnswer;
        q.explanation = buildExplanation(q, rawAnswer, passage.paragraphs);
        q.evidence = findEvidence(passage.paragraphs, rawAnswer);
      }
    }

    const slug = slugify(passage.title, testNum, pNum);
    results.push({
      slug,
      title: passage.title,
      subtitle: `Cambridge IELTS · Test ${testNum} · Passage ${pNum}`,
      source: `Cambridge IELTS Academic Reading Test ${testNum}`,
      difficulty: difficultyForPassage(pNum),
      testNumber: testNum,
      passageNumber: pNum,
      wordCount: passage.wordCount,
      headingBank,
      paragraphs: passage.paragraphs,
      questionGroups: groups,
    });
  }
  return results;
}

// Main
const allPassages = [];
for (let i = 0; i < TEST_FILES.length; i++) {
  const passages = processFile(TEST_FILES[i], i + 1);
  allPassages.push(...passages);
  console.log(`Processed ${TEST_FILES[i]}: ${passages.length} passages`);
}

console.log(`Total passages: ${allPassages.length}`);

const tsContent = `import { ReadingTest, ReadingPassage } from "@/types/ielts";

// Authentic Cambridge IELTS Academic Reading passages
// Extracted from official Cambridge IELTS practice materials
// DO NOT modify passage text — preserve original wording

export const passages: ReadingPassage[] = ${JSON.stringify(allPassages, null, 2)};

export const readingTests: ReadingTest[] = passages.map((passage) => ({
  slug: passage.slug,
  title: passage.title,
  subtitle: passage.subtitle || "Academic Reading Practice",
  source: passage.source,
  difficulty: passage.difficulty,
  testNumber: passage.testNumber,
  passageNumber: passage.passageNumber,
  passages: [passage],
}));

export function getReadingTest(slug: string): ReadingTest | undefined {
  return readingTests.find((t) => t.slug === slug);
}

export function getPassageCount(): number {
  return readingTests.length;
}
`;

fs.writeFileSync(OUT_FILE, tsContent, "utf8");
console.log(`Written to ${OUT_FILE}`);
