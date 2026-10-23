import { randomUUID } from "node:crypto";
import { json, parseBody, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { LOCAL_USER, requireProblemId } from "@/lib/problems";
import { savedCodeSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Saved code per language plus the starter templates to fall back on. */
export const GET = route<Ctx>(async (_req, { params }) => {
  const problemId = await requireProblemId((await params).id);
  const [problem, state] = await Promise.all([
    prisma.problem.findUniqueOrThrow({ where: { id: problemId }, select: { starterTemplates: true } }),
    prisma.userProblemState.findUnique({
      where: { userId_problemId: { userId: LOCAL_USER, problemId } },
      select: { savedCode: true, updatedAt: true },
    }),
  ]);
  return json({
    savedCode: state?.savedCode ?? {},
    starterTemplates: problem.starterTemplates,
    updatedAt: state?.updatedAt ?? null,
  });
});

/**
 * Saves code for one language. A single atomic upsert merges into the JSON map so
 * concurrent autosaves for different languages cannot overwrite each other.
 */
export const PUT = route<Ctx>(async (req, { params }) => {
  const problemId = await requireProblemId((await params).id);
  const { language, code } = await parseBody(req, savedCodeSchema);
  await prisma.$executeRaw`
    INSERT INTO "UserProblemState" ("id", "userId", "problemId", "savedCode", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${LOCAL_USER}, ${problemId}, jsonb_build_object(${language}::text, ${code}::text), now(), now())
    ON CONFLICT ("userId", "problemId") DO UPDATE
    SET "savedCode" = "UserProblemState"."savedCode" || EXCLUDED."savedCode", "updatedAt" = now()`;
  return json({ saved: true, language });
});
