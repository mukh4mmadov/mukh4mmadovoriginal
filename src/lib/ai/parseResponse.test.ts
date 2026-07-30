import { describe, expect, it } from "vitest";
import { formatParsedResponse, parseAIResponse } from "./parseResponse";

const structured = [
  "❌ Your Answer",
  "TRUE",
  "✅ Correct Answer",
  "FALSE",
  "📍 Evidence Paragraph",
  "See paragraph B, second sentence.",
  "🧠 Why Your Answer Was Wrong",
  "The passage contradicts the claim.",
  "🎯 IELTS Strategy",
  "Scan for the keyword first.",
  "💡 Vocabulary",
  "contradict = disagree with",
  "🔥 Challenge",
  "Find the paraphrase in 30 seconds.",
].join("\n");

describe("parseAIResponse", () => {
  it("always keeps the original content in rawContent", () => {
    const parsed = parseAIResponse("just some text");
    expect(parsed.rawContent).toBe("just some text");
  });

  it("extracts every structured section and trims the values", () => {
    const parsed = parseAIResponse(structured);
    expect(parsed.yourAnswer).toBe("TRUE");
    expect(parsed.correctAnswer).toBe("FALSE");
    expect(parsed.evidenceParagraph).toBe("See paragraph B, second sentence.");
    expect(parsed.whyWrong).toBe("The passage contradicts the claim.");
    expect(parsed.ieltsStrategy).toBe("Scan for the keyword first.");
    expect(parsed.vocabulary).toBe("contradict = disagree with");
    expect(parsed.challenge).toBe("Find the paraphrase in 30 seconds.");
  });

  it("leaves unmatched sections undefined", () => {
    const parsed = parseAIResponse("❌ Your Answer\nMaybe");
    expect(parsed.yourAnswer).toBe("Maybe");
    expect(parsed.correctAnswer).toBeUndefined();
    expect(parsed.challenge).toBeUndefined();
  });

  it("is case-insensitive for section headers", () => {
    const parsed = parseAIResponse("❌ your answer\nB\n✅ correct answer\nA");
    expect(parsed.yourAnswer).toBe("B");
    expect(parsed.correctAnswer).toBe("A");
  });
});

describe("formatParsedResponse", () => {
  it("returns unstructured content unchanged", () => {
    const parsed = parseAIResponse("A plain explanation with no headers.");
    expect(formatParsedResponse(parsed)).toBe(
      "A plain explanation with no headers.",
    );
  });

  it("bolds the section headers for structured content", () => {
    const parsed = parseAIResponse(structured);
    const formatted = formatParsedResponse(parsed);
    expect(formatted).toContain("❌ **Your Answer**");
    expect(formatted).toContain("✅ **Correct Answer**");
    expect(formatted).toContain("🔥 **Challenge**");
  });
});
