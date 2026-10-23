import type { Progress } from "@/lib/progress";
import { Difficulty } from "@/app/generated/prisma/enums";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { Meter } from "@/components/ui/meter";
import { Panel } from "@/components/ui/panel";

export function DifficultyBreakdown({ byDifficulty }: { byDifficulty: Progress["byDifficulty"] }) {
  return (
    <Panel title="By difficulty">
      <ul className="space-y-4 p-4">
        {Object.values(Difficulty).map((d) => {
          const b = byDifficulty[d];
          return (
            <li key={d}>
              <div className="mb-1.5 flex items-center justify-between">
                <DifficultyBadge difficulty={d} />
                <span className="text-xs tabular-nums text-ink-2">
                  {b.solved}
                  <span className="text-ink-muted"> / {b.total}</span>
                </span>
              </div>
              <Meter value={b.solved} total={b.total} label={`${d.toLowerCase()} problems`} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
