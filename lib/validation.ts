import { z } from "zod";
import {
  Difficulty,
  Language,
  ProblemMode,
  SubmissionKind,
  SubmissionStatus,
} from "@/app/generated/prisma/enums";
import { FUNCTION_TYPES, MAX_CODE_BYTES } from "@/constants/languages";

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
const slug = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, digits and hyphens");
const code = z
  .string()
  .refine((s) => Buffer.byteLength(s) <= MAX_CODE_BYTES, `Code exceeds ${MAX_CODE_BYTES} bytes`);
const identifier = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Must be a valid identifier")
  .max(64);

export const id = z.string().trim().min(1).max(64);
export const languageSchema = z.enum(Language);
export const languageCodeMap = z.partialRecord(languageSchema, code);

// ---------- Contests ----------

const contestFields = {
  title: text(200),
  slug: slug.optional(),
  platform: optionalText(100),
  url: z.url().max(500).nullish(),
  description: optionalText(20_000),
  startTime: z.coerce.date().nullish(),
  endTime: z.coerce.date().nullish(),
};

const endAfterStart = (c: { startTime?: Date | null; endTime?: Date | null }) =>
  !c.startTime || !c.endTime || c.endTime >= c.startTime;

export const contestCreateSchema = z
  .object(contestFields)
  .refine(endAfterStart, { message: "endTime must be after startTime", path: ["endTime"] });

export const contestUpdateSchema = z
  .object(contestFields)
  .partial()
  .refine(endAfterStart, { message: "endTime must be after startTime", path: ["endTime"] });

// ---------- Problems ----------

export const functionSpecSchema = z.object({
  name: identifier,
  params: z
    .array(z.object({ name: identifier, type: z.enum(FUNCTION_TYPES) }))
    .max(10),
  returnType: z.enum(FUNCTION_TYPES),
});

const exampleSchema = z.object({
  input: z.string().max(10_000),
  output: z.string().max(10_000),
  explanation: z.string().max(5_000).optional(),
});

const problemFields = {
  contestId: id.nullish(),
  label: optionalText(10),
  order: z.number().int().min(0).max(10_000).optional(),
  title: text(200),
  slug: slug.optional(),
  difficulty: z.enum(Difficulty).optional(),
  mode: z.enum(ProblemMode).optional(),
  topics: z.array(text(50)).max(20).optional(),
  statement: text(100_000),
  inputFormat: optionalText(20_000),
  outputFormat: optionalText(20_000),
  constraints: optionalText(20_000),
  examples: z.array(exampleSchema).max(20).optional(),
  functionSpec: functionSpecSchema.nullish(),
  starterTemplates: languageCodeMap.optional(),
  timeLimitMs: z.number().int().min(100).max(15_000).optional(),
  memoryLimitKb: z.number().int().min(16_384).max(524_288).optional(),
};

const functionModeNeedsSpec = (p: { mode?: string; functionSpec?: unknown }) =>
  p.mode !== ProblemMode.FUNCTION || p.functionSpec != null;

export const problemCreateSchema = z.object(problemFields).refine(functionModeNeedsSpec, {
  message: "FUNCTION mode problems require a functionSpec",
  path: ["functionSpec"],
});

export const problemUpdateSchema = z.object(problemFields).partial();

export const problemQuerySchema = z.object({
  contestId: id.optional(),
  difficulty: z.enum(Difficulty).optional(),
  topic: z.string().trim().max(50).optional(),
  status: z.enum(["solved", "attempted", "unattempted"]).optional(),
  q: z.string().trim().max(100).optional(),
});

// ---------- Test cases ----------

export const testCaseCreateSchema = z.object({
  input: z.string().max(1_000_000),
  expectedOutput: z.string().max(1_000_000),
  isSample: z.boolean().optional(),
  order: z.number().int().min(0).max(10_000).optional(),
});

export const testCaseBulkCreateSchema = z.object({
  testCases: z.array(testCaseCreateSchema).min(1).max(200),
});

export const testCaseUpdateSchema = testCaseCreateSchema.partial();

// ---------- Saved code ----------

export const savedCodeSchema = z.object({
  language: languageSchema,
  code,
});

// ---------- Submissions ----------

export const submissionCreateSchema = z.object({
  problemId: id,
  language: languageSchema,
  code: code.refine((s) => s.trim().length > 0, "Code is empty"),
  kind: z.enum(SubmissionKind).optional(),
});

export const submissionQuerySchema = z.object({
  problemId: id.optional(),
  status: z.enum(SubmissionStatus).optional(),
  kind: z.enum(SubmissionKind).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: id.optional(),
});
