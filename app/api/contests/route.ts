import { json, parseBody, route, slugify, uniqueSlug } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { contestCreateSchema } from "@/lib/validation";

export const GET = route(async () => {
  const contests = await prisma.contest.findMany({
    orderBy: [{ startTime: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: { _count: { select: { problems: true } } },
  });
  return json({
    contests: contests.map(({ _count, ...c }) => ({ ...c, problemCount: _count.problems })),
  });
});

export const POST = route(async (req) => {
  const { slug, ...data } = await parseBody(req, contestCreateSchema);
  const finalSlug = await uniqueSlug(slug ?? slugify(data.title), async (s) =>
    Boolean(await prisma.contest.findUnique({ where: { slug: s }, select: { id: true } })),
  );
  const contest = await prisma.contest.create({ data: { ...data, slug: finalSlug } });
  return json({ contest }, 201);
});
