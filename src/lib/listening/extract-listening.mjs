// Turns a stored Listening test page into data the exam screen renders:
// the question markup of each part, and the answer key. The test pages are
// static files in this repository (public/listening/data), read on the
// server; their scripts and styles are dropped, only the questions are kept.

// The markup from `start` up to its matching closing tag (same tag name).
function balancedElement(html, start, tag) {
  const pattern = new RegExp(`<${tag}\\b|</${tag}>`, "gi");
  pattern.lastIndex = start;
  let depth = 0;
  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    depth += match[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index + match[0].length);
  }
  return null;
}

const innerOf = (element) => element.slice(element.indexOf(">") + 1, element.lastIndexOf("<"));

// The object literal that follows `marker` in the page's script, evaluated.
// Only used on the repository's own test files, never on user input.
function readObject(html, marker) {
  const at = html.indexOf(marker);
  if (at === -1) return null;
  const open = html.indexOf("{", at + marker.length - 1);
  let depth = 0;
  let quote = null;
  for (let index = open; index < html.length; index += 1) {
    const char = html[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return Function(`"use strict"; return (${html.slice(open, index + 1)});`)();
    }
  }
  return null;
}

// Removes anything that could run code or hide content.
export function cleanQuestionHtml(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/\sstyle="\s*display\s*:\s*none;?\s*"/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

// Drag-and-drop matching slots become dropdowns with the same letters, which
// work the same way on phones and with a keyboard.
function slotsToSelects(html) {
  return html
    .replace(/<div class="ldm-slot" data-question="(\d+)" data-range="([A-Z])[–-]([A-Z])"[^>]*>[\s\S]*?<\/div>/g, (_, number, first, last) => {
      const letters = [];
      for (let code = first.charCodeAt(0); code <= last.charCodeAt(0); code += 1) letters.push(String.fromCharCode(code));
      return `<select id="q${number}" class="ldm-select"><option value="">–</option>${letters.map((letter) => `<option>${letter}</option>`).join("")}</select>`;
    })
    .replace(/\sdraggable="true"/g, "");
}

const toList = (value) => (Array.isArray(value) ? value : value == null ? [] : [value]).map((item) => String(item));

function controlType(partHtml, number) {
  if (new RegExp(`name="q${number}"[^>]*type="radio"|type="radio"[^>]*name="q${number}"`).test(partHtml)) return "Multiple Choice";
  if (new RegExp(`<select[^>]*id="q${number}"`).test(partHtml)) return "Matching";
  return "Completion";
}

const DATA_IMAGE = /src="data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)"/g;

// Pictures embedded in the parts (maps, plans), in order.
export function listPartImages(parts) {
  return parts.flatMap((part) => [...part.html.matchAll(DATA_IMAGE)].map((match) => ({ mime: match[1], base64: match[2] })));
}

/**
 * Returns { parts: [{ number, title, intro, html }], questions: { [n]: { part, type, prompt, answers } },
 * groups: [{ id, numbers, answers }] } or null when the page isn't a known format.
 * With imageSrc(index), embedded pictures are replaced by that URL so the
 * page doesn't carry them inline.
 */
export function extractListeningTest(html, { imageSrc } = {}) {
  const parts = [];
  if (html.includes('class="part-section"')) {
    const ranges = readObject(html, "partRanges =") || {};
    const pattern = /<section class="part-section" data-part="(\d)"/g;
    for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
      const element = balancedElement(html, match.index, "section");
      const number = Number(match[1]);
      const range = ranges[number];
      parts.push({ number, title: `Part ${number}`, intro: range ? `Questions ${range[0]}–${range[1]}` : "", html: cleanQuestionHtml(innerOf(element)) });
    }
  } else if (html.includes('class="section-content')) {
    const pattern = /<div id="section(\d)" class="section-content[^"]*"/g;
    for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
      const number = Number(match[1]);
      const element = balancedElement(html, match.index, "div");
      const banner = html.match(new RegExp(`<div id="banner${number}"[^>]*>([\\s\\S]*?)</div>`));
      const intro = banner ? banner[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().replace(/^Section \d\s*/, "") : "";
      parts.push({ number, title: `Part ${number}`, intro, html: slotsToSelects(cleanQuestionHtml(innerOf(element))) });
    }
  }
  if (parts.length !== 4) return null;

  const meta = readObject(html, "QUESTIONS =") || {};
  const keyA = readObject(html, "answers =");
  const keyB = readObject(html, "correctAnswers=");
  const groupKey = readObject(html, "groupAnswers =") || {};

  const groups = Object.entries(groupKey).map(([id, answers]) => {
    const [first, last] = id.replace(/^q/i, "").split("-").map(Number);
    const numbers = [];
    for (let number = first; number <= last; number += 1) numbers.push(number);
    return { id, numbers, answers: toList(answers) };
  });
  const groupOf = new Map(groups.flatMap((group) => group.numbers.map((number) => [number, group])));

  const questions = {};
  for (const part of parts) {
    const numbers = [...part.html.matchAll(/(?:id|name)="q(\d+)"|data-group="q(\d+)-(\d+)"/g)].flatMap((match) => (
      match[1] ? [Number(match[1])] : groups.find((group) => group.id === `q${match[2]}-${match[3]}`)?.numbers || []
    ));
    for (const number of new Set(numbers)) {
      const group = groupOf.get(number);
      const answers = group ? group.answers : toList(keyA?.[`q${number}`] ?? keyB?.[String(number)]);
      questions[number] = {
        part: part.number,
        type: meta[number]?.type || (group ? "Multiple Choice (choose two)" : controlType(part.html, number)),
        prompt: meta[number]?.prompt || "",
        answers,
      };
    }
  }
  if (imageSrc) {
    let index = 0;
    for (const part of parts) {
      part.html = part.html.replace(DATA_IMAGE, () => `src="${imageSrc(index++)}"`);
    }
  }
  return { parts, questions, groups };
}
