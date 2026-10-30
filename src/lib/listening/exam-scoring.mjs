// Marks a Listening exam answered on the site's own exam screen.

const SPELLINGS = {
  colour: "color", centre: "center", theatre: "theater", litre: "liter", metre: "meter",
  organise: "organize", organisation: "organization", mins: "minutes", programme: "program",
};

// Lower case, without punctuation, currency signs or extra spaces, and with
// British and American spellings treated the same.
export function normalizeListeningAnswer(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[£$€]/g, "")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/[^a-z0-9\s:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => SPELLINGS[word] || word)
    .join(" ");
}

export function isAcceptedAnswer(value, accepted) {
  const answer = normalizeListeningAnswer(value);
  return answer !== "" && accepted.some((option) => normalizeListeningAnswer(option) === answer);
}

/**
 * responses: { [number]: string, [groupId]: string[] } (a "choose two"
 * group stores the chosen letters under its id, e.g. "q11-12").
 * Returns the answers array the saved Listening results use.
 */
export function scoreListening(data, responses) {
  const groupOf = new Map(data.groups.flatMap((group) => group.numbers.map((number) => [number, group])));
  const groupMarks = new Map(data.groups.map((group) => {
    const chosen = [...new Set((responses[group.id] || []).map((letter) => String(letter).toUpperCase()))];
    const correct = chosen.filter((letter) => group.answers.includes(letter)).length;
    return [group.id, { chosen, correct }];
  }));
  return Object.entries(data.questions)
    .map(([key, question]) => [Number(key), question])
    .sort(([a], [b]) => a - b)
    .map(([number, question]) => {
      const group = groupOf.get(number);
      if (group) {
        const { chosen, correct } = groupMarks.get(group.id);
        const position = group.numbers.indexOf(number);
        return {
          number,
          section: question.part,
          type: question.type,
          prompt: question.prompt,
          userAnswer: position === 0 ? chosen.join(", ") : "",
          correctAnswer: position === 0 ? group.answers.join(", ") : "",
          score: position < correct ? 1 : 0,
          max: 1,
        };
      }
      const userAnswer = String(responses[number] ?? "").trim();
      return {
        number,
        section: question.part,
        type: question.type,
        prompt: question.prompt,
        userAnswer,
        correctAnswer: question.answers[0] || "",
        score: isAcceptedAnswer(userAnswer, question.answers) ? 1 : 0,
        max: 1,
      };
    });
}

// Whether question `number` has an answer (for the navigator).
export function isAnswered(data, responses, number) {
  const group = data.groups.find((item) => item.numbers.includes(number));
  if (group) return (responses[group.id] || []).length > group.numbers.indexOf(number);
  return String(responses[number] ?? "").trim() !== "";
}
