import { json, notFound, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const submission = await prisma.submission.findUnique({
    where: { id: (await params).id },
    include: { problem: { select: { id: true, slug: true, title: true } } },
  });
  if (!submission) throw notFound("Submission");
  return json({ submission });
});
