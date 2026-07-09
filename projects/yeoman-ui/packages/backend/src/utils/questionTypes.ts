import type { PromptAnswers } from "@yeoman/adapter/types";

export interface YeomanUIQuestion {
  name?: string;
  type?: string;
  message?: string | ((answers: PromptAnswers) => string);
  default?: unknown;
  choices?: unknown;
  when?: unknown;
  validate?: unknown;
  filter?: unknown;
  /** yeoman-ui GUI hint used to pick a custom question renderer. */
  guiType?: string;
  guiOptions?: { type?: string; [key: string]: unknown };
  // Replay markers set by ReplayUtils.setDefaults.
  __ForceDefault?: boolean;
  __origAnswer?: unknown;
  // Custom event-handler methods are attached by name at runtime.
  [key: string]: unknown;
}

export type YeomanUIQuestions = YeomanUIQuestion | YeomanUIQuestion[];

/** Normalize a single-or-array question value to an array. */
export function asArray(questions: YeomanUIQuestions): YeomanUIQuestion[] {
  return Array.isArray(questions) ? questions : [questions];
}

export type { PromptAnswers };
