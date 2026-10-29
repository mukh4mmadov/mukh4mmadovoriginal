"use client";

import { useState } from "react";
import { renumberInstructions } from "@/lib/reading/question-numbering.mjs";

const CHOICES = {
  "true-false-not-given": ["TRUE", "FALSE", "NOT GIVEN"],
  "yes-no-not-given": ["YES", "NO", "NOT GIVEN"],
};
const plain = (text) => text;

function QuestionInput({ question, passage, number, value, onChange }) {
  if (CHOICES[question.type]) {
    return (
      <div className="exam-options-inline" role="group" aria-label={`Answer for question ${number}`}>
        {CHOICES[question.type].map((option) => (
          <button key={option} type="button" className="exam-option" aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>
        ))}
      </div>
    );
  }
  if (question.type === "multiple-choice") {
    return (
      <div className="exam-options" role="group" aria-label={`Answer for question ${number}`}>
        {(question.options || []).map((option) => (
          <button key={option.key} type="button" className="exam-option" aria-pressed={value === option.key} onClick={() => onChange(option.key)}>
            <span className="exam-option-key" aria-hidden="true">{option.key}</span><span>{option.text}</span>
          </button>
        ))}
      </div>
    );
  }
  if (question.type === "matching-headings" && passage.headingBank?.length) {
    return (
      <select aria-label={`Choose a heading for question ${number}`} value={value} onChange={(event) => onChange(event.target.value)} className="exam-input exam-select mt-1">
        <option value="">Choose a heading</option>
        {passage.headingBank.map((heading) => <option key={heading.id} value={heading.id}>{heading.id}. {heading.text}</option>)}
      </select>
    );
  }
  if (question.type === "matching-headings") {
    // Without a heading list the answer is a paragraph letter.
    const letters = [...new Set(passage.paragraphs.map((paragraph) => paragraph.label).filter(Boolean))];
    return (
      <div className="exam-options-inline" role="group" aria-label={`Choose a paragraph for question ${number}`}>
        {letters.map((letter) => (
          <button key={letter} type="button" className="exam-option" aria-pressed={value === letter} onClick={() => onChange(letter)}>{letter}</button>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * One passage's question groups in the exam layout. Numbering starts at
 * firstNumber; answers are read and written through getValue / onAnswer.
 * renderText can wrap prompts (e.g. to make them highlightable).
 */
export default function ReadingQuestionList({ passage, firstNumber = 1, getValue, onAnswer, current, flags = [], onFocusQuestion, idPrefix = "exam-q", renderText = plain }) {
  const [limitErrors, setLimitErrors] = useState({});
  let number = firstNumber - 1;

  return (
    <div className="exam-questions">
      {passage.questionGroups.map((group, groupIndex) => {
        const groupFirst = number + 1;
        const groupLast = groupFirst + group.questions.length - 1;
        return (
          <section key={`${passage.slug}-group-${groupIndex}`} className="exam-group" aria-label={`Questions ${groupFirst}–${groupLast}`}>
            <p className="exam-group-title">Questions {groupFirst}{groupLast > groupFirst ? `–${groupLast}` : ""}</p>
            <p className="exam-instructions">{renumberInstructions(group.instructions, groupFirst)}</p>
            {group.wordBank?.length > 0 && (
              <div className="exam-box">
                <p className="exam-box-title">List of words</p>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">{group.wordBank.map((word) => <p key={word.id}><b>{word.id}</b> {word.text}</p>)}</div>
              </div>
            )}
            {group.questions[0]?.type === "matching-headings" && passage.headingBank?.length > 0 && (
              <div className="exam-box">
                <p className="exam-box-title">List of headings</p>
                <div className="grid gap-1">{passage.headingBank.map((heading) => <p key={heading.id}><b>{heading.id}</b> {heading.text}</p>)}</div>
              </div>
            )}
            {group.questions.map((question) => {
              number += 1;
              const questionNumber = number;
              const value = getValue(question) ?? "";
              const maxWords = question.maxWords || 1;
              const set = (next) => onAnswer(question, next);
              return (
                <div
                  key={question.id}
                  id={`${idPrefix}-${questionNumber}`}
                  className="exam-question"
                  data-current={questionNumber === current}
                  data-flagged={flags.includes(questionNumber)}
                  onFocusCapture={() => onFocusQuestion?.(questionNumber)}
                  onClick={() => onFocusQuestion?.(questionNumber)}
                >
                  <span className="exam-qnum" aria-hidden="true">{questionNumber}</span>
                  <div className="min-w-0 flex-1">
                    {question.type === "sentence-completion" ? (
                      <p>
                        {renderText(question.before, `${question.id}-before`)}{" "}
                        <input
                          aria-label={`Answer for question ${questionNumber}, maximum ${maxWords} word${maxWords === 1 ? "" : "s"}`}
                          aria-invalid={Boolean(limitErrors[question.id])}
                          aria-describedby={limitErrors[question.id] ? `${question.id}-limit` : undefined}
                          maxLength={120}
                          autoComplete="off"
                          spellCheck={false}
                          className="exam-input"
                          placeholder={group.wordBank?.length ? "letter" : undefined}
                          value={value}
                          onChange={(event) => {
                            const next = event.target.value;
                            const tooLong = next.trim().split(/\s+/).filter(Boolean).length > maxWords;
                            setLimitErrors((errors) => ({ ...errors, [question.id]: tooLong }));
                            if (!tooLong) set(next);
                          }}
                        />{" "}
                        {renderText(question.after, `${question.id}-after`)}
                      </p>
                    ) : (
                      <p>{renderText(question.type === "matching-headings" && passage.headingBank?.length ? question.paragraphLabel : question.prompt, `${question.id}-prompt`)}</p>
                    )}
                    {limitErrors[question.id] && (
                      <p id={`${question.id}-limit`} role="alert" className="mt-1 text-sm font-semibold" style={{ color: "var(--exam-flag)" }}>
                        Use no more than {maxWords} word{maxWords === 1 ? "" : "s"}.
                      </p>
                    )}
                    <QuestionInput question={question} passage={passage} number={questionNumber} value={value} onChange={set} />
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
