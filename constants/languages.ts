import { Language } from "@/app/generated/prisma/enums";

export const LANGUAGES = [
  { id: Language.CPP, label: "C++", monaco: "cpp" },
  { id: Language.JAVA, label: "Java", monaco: "java" },
  { id: Language.PYTHON, label: "Python", monaco: "python" },
  { id: Language.C, label: "C", monaco: "c" },
] as const;

/**
 * Parameter/return types supported by FUNCTION-mode problems. The judge harness
 * (Milestone E) only knows how to marshal these; anything else must be written
 * as a STDIN_STDOUT problem.
 */
export const FUNCTION_TYPES = [
  "int",
  "long",
  "double",
  "boolean",
  "string",
  "int[]",
  "long[]",
  "double[]",
  "string[]",
] as const;

export type FunctionType = (typeof FUNCTION_TYPES)[number];

/** Max size of one submitted / saved source file. */
export const MAX_CODE_BYTES = 64 * 1024;
