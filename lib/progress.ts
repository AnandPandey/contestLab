import { prisma } from "@/lib/prisma";
import { LOCAL_USER } from "@/lib/problems";
import { Difficulty } from "@/app/generated/prisma/enums";

type Bucket = { total: number; solved: number; attempted: number };

const emptyBucket = (): Bucket => ({ total: 0, solved: 0, attempted: 0 });
const pct = (solved: number, total: number) =>
  total === 0 ? 0 : Math.round((solved / total) * 1000) / 10;

/**
 * Aggregates progress from UserProblemState. "Solved" is a per-problem flag, so a
 * problem counts once regardless of how many accepted submissions it has.
 * Personal-scale data, so aggregating in memory keeps this simple.
 */
export async function getProgress() {
  const [problems, contests, recentSubmissions, submissionCount] = await Promise.all([
    prisma.problem.findMany({
      select: {
        contestId: true,
        difficulty: true,
        topics: true,
        states: { where: { userId: LOCAL_USER }, select: { solved: true, attempts: true } },
      },
    }),
    prisma.contest.findMany({
      select: { id: true, title: true, slug: true, startTime: true },
      orderBy: [{ startTime: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    prisma.submission.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        kind: true,
        language: true,
        status: true,
        passedCount: true,
        totalCount: true,
        timeMs: true,
        createdAt: true,
        problem: { select: { id: true, slug: true, title: true } },
      },
    }),
    prisma.submission.count({ where: { kind: "SUBMIT" } }),
  ]);

  const overall = emptyBucket();
  const byDifficulty = Object.fromEntries(
    Object.values(Difficulty).map((d) => [d, emptyBucket()]),
  ) as Record<Difficulty, Bucket>;
  const byContest = new Map<string, Bucket>();
  const byTopic = new Map<string, Bucket>();

  for (const p of problems) {
    const state = p.states[0];
    const solved = state?.solved ?? false;
    const attempted = (state?.attempts ?? 0) > 0;
    const buckets = [overall, byDifficulty[p.difficulty]];
    if (p.contestId) {
      if (!byContest.has(p.contestId)) byContest.set(p.contestId, emptyBucket());
      buckets.push(byContest.get(p.contestId)!);
    }
    for (const topic of p.topics) {
      if (!byTopic.has(topic)) byTopic.set(topic, emptyBucket());
      buckets.push(byTopic.get(topic)!);
    }
    for (const b of buckets) {
      b.total++;
      if (solved) b.solved++;
      if (attempted) b.attempted++;
    }
  }

  const withPct = (b: Bucket) => ({ ...b, completion: pct(b.solved, b.total) });

  return {
    totalProblems: overall.total,
    solvedProblems: overall.solved,
    attemptedProblems: overall.attempted,
    completion: pct(overall.solved, overall.total),
    totalSubmissions: submissionCount,
    byDifficulty: Object.fromEntries(
      Object.entries(byDifficulty).map(([d, b]) => [d, withPct(b)]),
    ),
    byContest: contests.map((c) => ({ ...c, ...withPct(byContest.get(c.id) ?? emptyBucket()) })),
    byTopic: [...byTopic.entries()]
      .map(([topic, b]) => ({ topic, ...withPct(b) }))
      .sort((a, b) => b.total - a.total || a.topic.localeCompare(b.topic)),
    recentSubmissions,
  };
}
