import assert from "node:assert/strict";
import test from "node:test";
import { isAcceptedAnswer, isAnswered, normalizeListeningAnswer, scoreListening } from "./exam-scoring.mjs";

test("answers match regardless of case, punctuation, money signs and spelling", () => {
  assert.equal(normalizeListeningAnswer("  £3,834. "), "3834");
  assert.equal(normalizeListeningAnswer("City Centre"), "city center");
  assert.equal(normalizeListeningAnswer("10:30"), "10:30");
  assert.ok(isAcceptedAnswer("The Information-Desk", ["information desk", "the information desk"]));
  assert.ok(isAcceptedAnswer("colour", ["color"]));
  assert.ok(!isAcceptedAnswer("", ["x"]));
  assert.ok(!isAcceptedAnswer("lockers room", ["lockers"]));
});

const data = {
  questions: {
    1: { part: 1, type: "Completion", prompt: "a", answers: ["weight"] },
    2: { part: 1, type: "Multiple Choice", prompt: "b", answers: ["B"] },
    11: { part: 2, type: "Multiple Choice (choose two)", prompt: "", answers: ["E", "C"] },
    12: { part: 2, type: "Multiple Choice (choose two)", prompt: "", answers: ["E", "C"] },
  },
  groups: [{ id: "q11-12", numbers: [11, 12], answers: ["E", "C"] }],
};

test("scores single answers and gives one mark per correct letter in a choose-two group", () => {
  const answers = scoreListening(data, { 1: "Weight", 2: "C", "q11-12": ["C", "A"] });
  assert.deepEqual(answers.map((answer) => [answer.number, answer.score]), [[1, 1], [2, 0], [11, 1], [12, 0]]);
  assert.deepEqual([answers[2].userAnswer, answers[2].correctAnswer], ["C, A", "E, C"]);
  const both = scoreListening(data, { "q11-12": ["E", "C"] });
  assert.deepEqual(both.slice(2).map((answer) => answer.score), [1, 1]);
  assert.equal(isAnswered(data, { "q11-12": ["E"] }, 11), true);
  assert.equal(isAnswered(data, { "q11-12": ["E"] }, 12), false);
  assert.equal(isAnswered(data, { 1: "  " }, 1), false);
});
