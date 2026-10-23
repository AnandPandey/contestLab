import type { Language, SubmissionKind, SubmissionStatus } from "@/app/generated/prisma/enums";

/**
 * One test's outcome as stored in Submission.results and sent to the client.
 * Hidden tests carry only status and resource usage: never input, expected or
 * actual output.
 */
export type TestResult = {
  index: number;
  isSample: boolean;
  status: SubmissionStatus;
  timeMs?: number | null;
  memoryKb?: number | null;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  stderr?: string;
};

/** Shape of GET /api/submissions/[id] as consumed by the workspace. */
export type SubmissionDetail = {
  id: string;
  kind: SubmissionKind;
  language: Language;
  code: string;
  status: SubmissionStatus;
  passedCount: number | null;
  totalCount: number | null;
  timeMs: number | null;
  memoryKb: number | null;
  compileOutput: string | null;
  errorMessage: string | null;
  results: TestResult[] | null;
  createdAt: string;
  completedAt: string | null;
};

export type SubmissionListItem = Pick<
  SubmissionDetail,
  "id" | "kind" | "language" | "status" | "passedCount" | "totalCount" | "timeMs" | "memoryKb" | "createdAt"
>;

export const isPendingStatus = (s: SubmissionStatus) => s === "PENDING" || s === "RUNNING";
