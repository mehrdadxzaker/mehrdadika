import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyCourseAnswer,
  canCompleteCourseLesson,
  courseLessonKey,
  freshLessonProgress,
  sanitizeCourseState,
  type CourseBinding,
} from "./model";
import type { CourseActivity, CourseLesson } from "./types";

const binding: CourseBinding = {
  manifestPath: "content/releases/science-1/manifest.json",
  manifestHash: "a".repeat(64),
  sourceHash: "b".repeat(64),
  bundleHash: "c".repeat(64),
  revision: "science-1",
};
const activity: CourseActivity = {
  id: "cause",
  kind: "choice",
  checks: "english",
  prompt: "Choose a reason",
  choices: [
    { id: "because", text: "because" },
    { id: "then", text: "then" },
  ],
  answer: ["because"],
  explanation: "Because introduces a reason.",
};
const lesson: CourseLesson = {
  id: "puddles",
  title: "Where puddles go",
  question: "What happens?",
  englishGoal: "Give a cause",
  scienceGoal: "Explain evaporation",
  minutes: 10,
  image: "figure.svg",
  imageAlt: "A puddle",
  sentences: [],
  targetSenseIds: [],
  pattern: "because",
  patternExample: "It dries because water evaporates.",
  activities: [activity],
  production: {
    prompt: "Explain",
    starter: "The puddle...",
    models: ["Water evaporates.", "The puddle becomes smaller."],
    checklist: ["I explained a cause.", "I used because."],
  },
};

test("course attempts preserve the first response when feedback is retried", () => {
  const p = freshLessonProgress(binding);
  const wrong = applyCourseAnswer(p, activity, ["then"], false);
  const corrected = applyCourseAnswer(wrong, activity, ["because"], true);
  assert.equal(corrected.answers.cause.firstCorrect, false);
  assert.deepEqual(corrected.answers.cause.firstValue, ["then"]);
  assert.equal(corrected.answers.cause.correct, true);
  assert.equal(corrected.answers.cause.attempts, 2);
  assert.equal(corrected.answers.cause.helpUsed, true);
  assert.equal(applyCourseAnswer(p, activity, ["unknown"], false), p);
});
test("sequencing requires every unique known choice in its authored order", () => {
  const sequence = {
    ...activity,
    kind: "sequence" as const,
    answer: ["then", "because"],
  };
  const p = freshLessonProgress(binding);
  assert.equal(applyCourseAnswer(p, sequence, ["then", "then"], false), p);
  assert.equal(applyCourseAnswer(p, sequence, ["then"], false), p);
  assert.equal(
    applyCourseAnswer(p, sequence, ["then", "because"], false).answers.cause
      .correct,
    true,
  );
});
test("lesson completion requires participation, writing and the complete self-review", () => {
  const p = applyCourseAnswer(
    freshLessonProgress(binding),
    activity,
    ["then"],
    false,
  );
  assert.equal(canCompleteCourseLesson(p, lesson), false);
  const written = {
    ...p,
    draft: "The puddle dries because water evaporates.",
    reviewed: true,
    checklist: [true, true],
  };
  assert.equal(canCompleteCourseLesson(written, lesson), true);
  assert.equal(
    canCompleteCourseLesson({ ...written, checklist: [true] }, lesson),
    false,
  );
  assert.equal(
    canCompleteCourseLesson({ ...written, reviewed: false }, lesson),
    false,
  );
});
test("course backup state stays bound to its dataset and exact release", () => {
  const key = courseLessonKey("water", "puddles");
  const source = {
    version: 1,
    datasetId: "english:pt-BR",
    lessons: {
      [key]: {
        ...freshLessonProgress(binding),
        draft: "x".repeat(7000),
        step: 99,
      },
    },
    last: { courseId: "water", lessonId: "puddles" },
  };
  assert.deepEqual(sanitizeCourseState(source, "english:es-419").lessons, {});
  const state = sanitizeCourseState(source, "english:pt-BR");
  assert.equal(state.lessons[key].draft.length, 6000);
  assert.equal(state.lessons[key].step, 5);
  assert.equal(state.lessons[key].binding.manifestHash, binding.manifestHash);
  const bad = {
    ...source,
    lessons: {
      [key]: {
        ...source.lessons[key],
        binding: { ...binding, manifestPath: "../secrets" },
      },
    },
  };
  assert.deepEqual(sanitizeCourseState(bad, "english:pt-BR").lessons, {});
  assert.equal(sanitizeCourseState(bad, "english:pt-BR").last, undefined);
});
