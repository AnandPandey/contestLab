import { z } from "zod";
import { json, parseBody, parseQuery, route, slugify, uniqueSlug } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listProblems } from "@/lib/problems";
import { problemCreateSchema, problemQuerySchema, testCaseCreateSchema } from "@/lib/validation";
import { Prisma } from "@/app/generated/prisma/client";

export const GET = route(async (req) => {
  const problems = await listProblems(parseQuery(req, problemQuerySchema));
  return json({ problems });
});

const createWithTests = problemCreateSchema.and(
  z.object({ testCases: z.array(testCaseCreateSchema).max(200).optional() }),
);

export const POST = route(async (req) => {
  const { slug, testCases, functionSpec, ...data } = await parseBody(req, createWithTests);
  const finalSlug = await uniqueSlug(slug ?? slugify(data.title), async (s) =>
    Boolean(await prisma.problem.findUnique({ where: { slug: s }, select: { id: true } })),
  );
  const problem = await prisma.problem.create({
    data: {
      ...data,
      slug: finalSlug,
      functionSpec: functionSpec ?? Prisma.DbNull,
      testCases: testCases?.length
        ? { create: testCases.map((tc, i) => ({ ...tc, order: tc.order ?? i })) }
        : undefined,
    },
    select: { id: true, slug: true, title: true },
  });
  return json({ problem }, 201);
});
