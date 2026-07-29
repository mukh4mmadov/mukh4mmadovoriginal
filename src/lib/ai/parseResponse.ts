export interface ParsedAIResponse {
  yourAnswer?: string;
  correctAnswer?: string;
  evidenceParagraph?: string;
  whyWrong?: string;
  ieltsStrategy?: string;
  vocabulary?: string;
  challenge?: string;
  rawContent: string;
}

const SECTION_PATTERNS = {
  yourAnswer: /❌\s*Your Answer\s*\n([\s\S]*?)(?=\n✅|\n📍|\n🧠|\n🎯|\n💡|\n🔥|$)/i,
  correctAnswer: /✅\s*Correct Answer\s*\n([\s\S]*?)(?=\n❌|\n📍|\n🧠|\n🎯|\n💡|\n🔥|$)/i,
  evidenceParagraph: /📍\s*Evidence Paragraph\s*\n([\s\S]*?)(?=\n❌|\n✅|\n🧠|\n🎯|\n💡|\n🔥|$)/i,
  whyWrong: /🧠\s*Why Your Answer Was Wrong\s*\n([\s\S]*?)(?=\n❌|\n✅|\n📍|\n🎯|\n💡|\n🔥|$)/i,
  ieltsStrategy: /🎯\s*IELTS Strategy\s*\n([\s\S]*?)(?=\n❌|\n✅|\n📍|\n🧠|\n💡|\n🔥|$)/i,
  vocabulary: /💡\s*Vocabulary\s*\n([\s\S]*?)(?=\n❌|\n✅|\n📍|\n🧠|\n🎯|\n🔥|$)/i,
  challenge: /🔥\s*Challenge\s*\n([\s\S]*?)(?=\n❌|\n✅|\n📍|\n🧠|\n🎯|\n💡|$)/i,
};

export function parseAIResponse(content: string): ParsedAIResponse {
  const result: ParsedAIResponse = {
    rawContent: content,
  };

  // Extract each section
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const trimmed = match[1].trim();
      if (trimmed) {
        (result as unknown as ParsedAIResponse)[key as keyof ParsedAIResponse] = trimmed;
      }
    }
  }

  return result;
}

export function formatParsedResponse(parsed: ParsedAIResponse): string {
  let formatted = parsed.rawContent;

  // If the response wasn't structured, return as-is
  const hasStructuredSections = Object.values(SECTION_PATTERNS).some(
    pattern => pattern.test(parsed.rawContent)
  );

  if (!hasStructuredSections) {
    return formatted;
  }

  // Format structured sections with better styling
  return formatted
    .replace(/❌\s*Your Answer/gi, '\n\n❌ **Your Answer**')
    .replace(/✅\s*Correct Answer/gi, '\n\n✅ **Correct Answer**')
    .replace(/📍\s*Evidence Paragraph/gi, '\n\n📍 **Evidence Paragraph**')
    .replace(/🧠\s*Why Your Answer Was Wrong/gi, '\n\n🧠 **Why Your Answer Was Wrong**')
    .replace(/🎯\s*IELTS Strategy/gi, '\n\n🎯 **IELTS Strategy**')
    .replace(/💡\s*Vocabulary/gi, '\n\n💡 **Vocabulary**')
    .replace(/🔥\s*Challenge/gi, '\n\n🔥 **Challenge**')
    .trim();
}
