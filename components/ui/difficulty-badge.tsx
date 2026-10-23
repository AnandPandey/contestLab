import type { Difficulty } from "@/app/generated/prisma/enums";

export const DIFFICULTY_META: Record<Difficulty, { label: string; dot: string }> = {
  EASY: { label: "Easy", dot: "bg-easy" },
  MEDIUM: { label: "Medium", dot: "bg-medium" },
  HARD: { label: "Hard", dot: "bg-hard" },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
