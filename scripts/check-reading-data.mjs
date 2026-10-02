import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const dataDirectory = resolve(projectDirectory, "src/data");
const playerPath = resolve(projectDirectory, "src/components/reading/ReadingTestPlayer.jsx");
const entryDataPath = resolve(dataDirectory, "readingTests_new.js");
const relativeImportPattern = /from\s+(["'])(\.{1,2}\/[^"']+)\1/g;

function materializeDataModule(sourcePath, temporaryDirectory, materializedModules) {
  const absoluteSourcePath = resolve(sourcePath);
  if (!absoluteSourcePath.startsWith(`${dataDirectory}${sep}`)) {
    throw new Error(`Question data import is outside src/data: ${absoluteSourcePath}`);
  }
  if (materializedModules.has(absoluteSourcePath)) {
    return materializedModules.get(absoluteSourcePath);
  }

  const virtualPath = join(
    temporaryDirectory,
    relative(dataDirectory, absoluteSourcePath).replace(/\.js$/, ".mjs"),
  );
  materializedModules.set(absoluteSourcePath, virtualPath);

  let source = readFileSync(absoluteSourcePath, "utf8");
  source = source.replace(relativeImportPattern, (statement, quote, specifier) => {
    const unresolvedPath = resolve(dirname(absoluteSourcePath), specifier);
    const dependencyPath = unresolvedPath.endsWith(".js")
      ? unresolvedPath
      : `${unresolvedPath}.js`;
    const virtualDependencyPath = materializeDataModule(
      dependencyPath,
      temporaryDirectory,
      materializedModules,
    );
    let rewrittenSpecifier = relative(dirname(virtualPath), virtualDependencyPath)
      .split(sep)
      .join("/");
    if (!rewrittenSpecifier.startsWith(".")) rewrittenSpecifier = `./${rewrittenSpecifier}`;
    return `from ${quote}${rewrittenSpecifier}${quote}`;
  });

  mkdirSync(dirname(virtualPath), { recursive: true });
  writeFileSync(virtualPath, source);
  return virtualPath;
}

async function loadAssembledReadingTests() {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "reading-data-check-"));
  const resolvedTemporaryDirectory = resolve(temporaryDirectory);

  try {
    const entryPath = materializeDataModule(
      entryDataPath,
      resolvedTemporaryDirectory,
      new Map(),
    );
    const imported = await import(pathToFileURL(entryPath).href);
    return imported.default?.readingTests;
  } finally {
    const temporaryRoot = resolve(tmpdir());
    if (!resolvedTemporaryDirectory.startsWith(`${temporaryRoot}${sep}`)) {
      throw new Error(`Refusing to remove unexpected temporary path: ${resolvedTemporaryDirectory}`);
    }
    rmSync(resolvedTemporaryDirectory, { recursive: true, force: true });
  }
}

function getRenderedQuestionTypes() {
  const playerSource = readFileSync(playerPath, "utf8");
  const types = new Set(
    [...playerSource.matchAll(/\bq\.type\s*===\s*["']([^"']+)["']/g)]
      .map((match) => match[1]),
  );
  if (types.size === 0) {
    throw new Error("Could not find question type render branches in ReadingTestPlayer.jsx.");
  }
  return types;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasAnswerKey(answer) {
  if (Array.isArray(answer)) return answer.some(hasText);
  return hasText(answer);
}

function validateReadingTests(readingTests, renderedTypes) {
  const errors = [];
  let questionCount = 0;

  for (const test of readingTests || []) {
    for (const [passageIndex, passage] of (test.passages || []).entries()) {
      const slug = passage.slug || test.slug || `passage-${passageIndex + 1}`;
      const paragraphLabels = [...new Set(
        (passage.paragraphs || []).map((paragraph) => paragraph.label).filter(hasText),
      )];

      for (const [groupIndex, group] of (passage.questionGroups || []).entries()) {
        for (const question of group.questions || []) {
          questionCount += 1;
          const questionId = question.id || question.number || "(missing id)";
          const location = `passage "${slug}", group ${groupIndex + 1}, question "${questionId}"`;
          const type = question.type;

          if (!renderedTypes.has(type)) {
            errors.push(`${location}: unsupported question type "${type || "(missing type)"}"; ReadingTestPlayer has no render branch for it.`);
          }

          if (type === "sentence-completion") {
            if (!hasText(question.before) && !hasText(question.after)) {
              errors.push(`${location}: empty prompt; sentence-completion requires text in "before" or "after".`);
            }
          } else if (type === "matching-headings" && passage.headingBank?.length > 0) {
            if (!hasText(question.paragraphLabel)) {
              errors.push(`${location}: empty rendered prompt; matching-headings with a heading bank requires "paragraphLabel".`);
            }
            if (!passage.headingBank.some((heading) => hasText(heading.id) && hasText(heading.text))) {
              errors.push(`${location}: no renderable heading choices in the passage heading bank.`);
            }
          } else if (type === "matching-headings") {
            if (!hasText(question.prompt)) {
              errors.push(`${location}: empty prompt; matching-headings without a heading bank renders "prompt".`);
            }
            if (paragraphLabels.length === 0) {
              errors.push(`${location}: no renderable choices; matching-headings without a heading bank requires labeled passage paragraphs.`);
            }
          } else if (renderedTypes.has(type) && !hasText(question.prompt)) {
            errors.push(`${location}: empty prompt.`);
          }

          if (type === "multiple-choice" && (!Array.isArray(question.options) || question.options.length === 0)) {
            errors.push(`${location}: multiple-choice requires at least one renderable option.`);
          }

          if (!hasAnswerKey(question.answer)) {
            errors.push(`${location}: missing or empty answer key.`);
          }
        }
      }
    }
  }

  return { errors, questionCount };
}

function findQuestion(readingTests, slug, questionId) {
  const test = readingTests.find((item) => item.slug === slug);
  const passage = test?.passages?.find((item) => item.slug === slug);
  return passage?.questionGroups
    ?.flatMap((group) => group.questions || [])
    .find((question) => question.id === questionId);
}

function assertInvalidFixtureIsRejected(label, readingTests, renderedTypes, expectedMessage) {
  const { errors } = validateReadingTests(readingTests, renderedTypes);
  const failure = errors.find((error) => error.includes(expectedMessage));
  if (!failure) {
    throw new Error(`Validator self-check failed: ${label} fixture was not rejected as expected.`);
  }
  console.log(`Expected rejection (${label}): ${failure}`);
}

const readingTests = await loadAssembledReadingTests();
if (!Array.isArray(readingTests)) {
  throw new Error("readingTests_new.js did not assemble an exported readingTests array.");
}

const renderedTypes = getRenderedQuestionTypes();
const { errors, questionCount } = validateReadingTests(readingTests, renderedTypes);
console.log(`Renderer question types: ${[...renderedTypes].join(", ")}`);

if (errors.length > 0) {
  console.error(`Question data check failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Question data check passed: ${readingTests.length} passages, ${questionCount} questions.`);
}

if (process.argv.includes("--self-test-invalid")) {
  const emptyPromptFixture = structuredClone(readingTests);
  const emptyPromptQuestion = findQuestion(emptyPromptFixture, "the-wonder-plant", "q1");
  if (!emptyPromptQuestion) throw new Error("Could not locate The Wonder Plant Q1 for the empty-prompt self-check.");
  emptyPromptQuestion.prompt = "   ";
  assertInvalidFixtureIsRejected(
    "empty prompt",
    emptyPromptFixture,
    renderedTypes,
    'passage "the-wonder-plant", group 1, question "q1": empty prompt',
  );

  const missingKeyFixture = structuredClone(readingTests);
  const missingKeyQuestion = findQuestion(missingKeyFixture, "the-wonder-plant", "q1");
  if (!missingKeyQuestion) throw new Error("Could not locate The Wonder Plant Q1 for the missing-key self-check.");
  delete missingKeyQuestion.answer;
  assertInvalidFixtureIsRejected(
    "missing answer key",
    missingKeyFixture,
    renderedTypes,
    'passage "the-wonder-plant", group 1, question "q1": missing or empty answer key',
  );
  console.log("Question data validator self-checks passed; fixtures were in-memory copies and source data was not changed.");
}
