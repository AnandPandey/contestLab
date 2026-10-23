import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { byIdOrSlug, problemSummarySelect, serializeProblemSummary } from "@/lib/problems";

/** A contest with its problems in contest order, or null. */
export const getContest = cache(async (key: string) => {
  const contest = await prisma.contest.findFirst({ where: byIdOrSlug(key) });
  if (!contest) return null;
  const problems = await prisma.problem.findMany({
    where: { contestId: contest.id },
    orderBy: [{ order: "asc" }, { label: "asc" }, { createdAt: "asc" }],
    select: problemSummarySelect,
  });
  // loadedAt is the reference point for "upcoming / live / ended".
  return { ...contest, problems: problems.map(serializeProblemSummary), loadedAt: new Date() };
});

export async function listContestOptions() {
  return prisma.contest.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: [{ startTime: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
}
