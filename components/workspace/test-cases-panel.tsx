"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export type SampleCase = { id: string; input: string; expectedOutput: string };

const pre = "max-h-48 overflow-auto rounded-md bg-canvas p-2.5 font-mono text-xs whitespace-pre-wrap text-ink-2";

export function TestCasesPanel({ samples, hiddenCount }: { samples: SampleCase[]; hiddenCount: number }) {
  const [active, setActive] = useState(0);
  const current = samples[active];

  if (samples.length === 0) {
    return (
      <p className="p-4 text-sm text-ink-muted">
        This problem has no sample test cases yet. Add them from the problem editor.
      </p>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-1">
        {samples.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              i === active ? "bg-surface-2 text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            Case {i + 1}
          </button>
        ))}
        {hiddenCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-muted">
            <Lock className="size-3" aria-hidden />
            {hiddenCount} hidden {hiddenCount === 1 ? "test" : "tests"} run on Submit
          </span>
        )}
      </div>
      {current && (
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs text-ink-muted">Input</p>
            <pre className={pre}>{current.input || " "}</pre>
          </div>
          <div>
            <p className="mb-1 text-xs text-ink-muted">Expected output</p>
            <pre className={pre}>{current.expectedOutput || " "}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
