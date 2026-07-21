import type { Question } from "inquirer";

export type YeomanUIQuestion = Pick<
  Question,
  "type" | "name" | "message" | "default" | "when" | "validate" | "filter"
> & {
  // Choices live on inquirer's list-style questions, not the base Question
  choices?: unknown;
  // yeoman-ui GUI hint used to pick a custom question renderer
  guiType?: string;
  guiOptions?: { type?: string; [key: string]: unknown };
  // Replay markers set by ReplayUtils.setDefaults
  __ForceDefault?: boolean;
  __origAnswer?: unknown;
  // Custom event-handler methods are attached by name at runtime
  [key: string]: unknown;
};

export type YeomanUIQuestions = YeomanUIQuestion | YeomanUIQuestion[];
