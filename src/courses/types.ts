import type { UiLocale } from "../i18n/locale";

export interface CourseRef {
  path: string;
  sha256: string;
}
export interface CourseReview {
  status: "preview" | "approved";
  humanReviewed: boolean;
  reviewer?: string;
  domainReviewer?: string;
  domainQualified?: boolean;
  contentHash?: string;
}
export interface CourseChoice {
  id: string;
  text: string;
}
export interface CourseActivity {
  id: string;
  kind: "choice" | "cloze" | "label" | "sequence";
  checks: "english" | "science";
  prompt: string;
  choices: CourseChoice[];
  answer: string[];
  explanation: string;
}
export interface CourseLesson {
  id: string;
  title: string;
  question: string;
  englishGoal: string;
  scienceGoal: string;
  minutes: number;
  image: string;
  imageAlt: string;
  sentences: { id: string; en: string }[];
  targetSenseIds: string[];
  pattern: string;
  patternExample: string;
  activities: CourseActivity[];
  production: {
    prompt: string;
    starter: string;
    models: string[];
    checklist: string[];
  };
}
export interface ScienceCourse {
  id: string;
  revision: string;
  title: string;
  subtitle: string;
  level: string;
  subjectDepth: string;
  cover: string;
  visualStyle: string;
  publication: "draft" | "preview" | "published" | "withdrawn";
  review: CourseReview;
  provenance: { license: string; source: string; aiAssisted: boolean };
  lessons: CourseLesson[];
}
export interface LessonSupport {
  title: string;
  question: string;
  englishGoal: string;
  scienceGoal: string;
  imageAlt: string;
  sentences: Record<string, string>;
  patternTip: string;
  activities: Record<string, { prompt: string; explanation: string }>;
  production: { prompt: string; starterTip: string; checklist: string[] };
}
export interface CourseOverlay {
  schemaVersion: 1;
  locale: UiLocale;
  courseId: string;
  sourceHash: string;
  publication: "draft" | "preview" | "published" | "withdrawn";
  review: CourseReview;
  title: string;
  subtitle: string;
  lessons: Record<string, LessonSupport>;
}
export interface CourseBundle {
  schemaVersion: 1;
  sourceHashes: Record<string, string>;
  courses: ScienceCourse[];
  overlays: CourseOverlay[];
}
export interface LocalizedCourse {
  course: ScienceCourse;
  support: CourseOverlay;
  sourceHash: string;
}
