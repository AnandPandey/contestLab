import { json, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const GET = route(async () => {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("[health] database check failed", err);
    return json({ status: "error", database: "unreachable" }, 503);
  }
  const latencyMs = Date.now() - started;
  const [contests, problems, submissions] = await Promise.all([
    prisma.contest.count(),
    prisma.problem.count(),
    prisma.submission.count(),
  ]);
  return json({
    status: "ok",
    database: "ok",
    latencyMs,
    counts: { contests, problems, submissions },
    judgeConfigured: Boolean(process.env.JUDGE0_URL),
  });
});
