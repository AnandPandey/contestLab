"use client";

import { Plus, X } from "lucide-react";
import { Button, monoInputClass, inputClass } from "@/components/ui/form";

export type Example = { input: string; output: string; explanation?: string };

export function ExamplesEditor({ value, onChange }: { value: Example[]; onChange: (v: Example[]) => void }) {
  const update = (i: number, patch: Partial<Example>) =>
    onChange(value.map((ex, j) => (j === i ? { ...ex, ...patch } : ex)));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-ink-muted">
          Examples are shown in the statement. They are separate from test cases, which the judge runs.
        </p>
      )}
      {value.map((ex, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-line bg-canvas/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-2">Example {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="rounded p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
              aria-label={`Remove example ${i + 1}`}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <textarea
              rows={3}
              value={ex.input}
              onChange={(e) => update(i, { input: e.target.value })}
              placeholder="Input"
              aria-label={`Example ${i + 1} input`}
              className={monoInputClass}
            />
            <textarea
              rows={3}
              value={ex.output}
              onChange={(e) => update(i, { output: e.target.value })}
              placeholder="Output"
              aria-label={`Example ${i + 1} output`}
              className={monoInputClass}
            />
          </div>
          <textarea
            rows={2}
            value={ex.explanation ?? ""}
            onChange={(e) => update(i, { explanation: e.target.value })}
            placeholder="Explanation (optional)"
            aria-label={`Example ${i + 1} explanation`}
            className={inputClass}
          />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...value, { input: "", output: "" }])}>
        <Plus className="size-4" aria-hidden />
        Add example
      </Button>
    </div>
  );
}
