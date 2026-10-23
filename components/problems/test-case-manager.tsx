"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, FileUp, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { Button, FormError, monoInputClass } from "@/components/ui/form";

export type ClientTestCase =
  | { id: string; isSample: true; input: string; expectedOutput: string; order: number }
  | { id: string; isSample: false; order: number; inputBytes: number; outputBytes: number };

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

/** Two textareas (input / expected output) with optional "load from file" buttons. */
function CaseEditor({
  initial,
  submitLabel,
  showVisibility,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: { input: string; expectedOutput: string };
  submitLabel: string;
  showVisibility: boolean;
  busy: boolean;
  onSubmit: (v: { input: string; expectedOutput: string; isSample: boolean }) => void;
  onCancel?: () => void;
}) {
  const [input, setInput] = useState(initial?.input ?? "");
  const [expectedOutput, setExpectedOutput] = useState(initial?.expectedOutput ?? "");
  const [isSample, setIsSample] = useState(false);

  const loadFile = (setter: (v: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setter(await file.text());
    e.target.value = "";
  };

  const area = (label: string, value: string, setter: (v: string) => void) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-2">{label}</span>
        <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-ink-muted hover:text-ink">
          <FileUp className="size-3.5" aria-hidden />
          Load file
          <input type="file" className="sr-only" onChange={loadFile(setter)} />
        </label>
      </div>
      <textarea
        rows={5}
        spellCheck={false}
        value={value}
        onChange={(e) => setter(e.target.value)}
        aria-label={label}
        className={monoInputClass}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {area("Input", input, setInput)}
        {area("Expected output", expectedOutput, setExpectedOutput)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showVisibility ? (
          <label className="inline-flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={isSample}
              onChange={(e) => setIsSample(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            Sample (visible in the workspace)
          </label>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            disabled={busy || (!input && !expectedOutput)}
            onClick={() => onSubmit({ input, expectedOutput, isSample })}
          >
            {busy ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TestCaseManager({ problemId, initial }: { problemId: string; initial: ClientTestCase[] }) {
  const router = useRouter();
  const [cases, setCases] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(initial.length === 0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/problems/${problemId}/testcases`;
  const samples = cases.filter((c) => c.isSample);
  const hidden = cases.filter((c) => !c.isSample);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const replace = (tc: ClientTestCase) => setCases((cs) => cs.map((c) => (c.id === tc.id ? tc : c)));

  const add = (v: { input: string; expectedOutput: string; isSample: boolean }) =>
    run("add", async () => {
      const { testCases } = await apiFetch<{ testCases: ClientTestCase[] }>(base, {
        method: "POST",
        body: { testCases: [v] },
      });
      setCases((cs) => [...cs, ...testCases]);
      setAdding(false);
    });

  const update = (id: string, body: object) =>
    run(id, async () => {
      const { testCase } = await apiFetch<{ testCase: ClientTestCase }>(`${base}/${id}`, { method: "PATCH", body });
      replace(testCase);
      setEditing(null);
    });

  const remove = (id: string) => {
    if (!window.confirm("Delete this test case?")) return;
    run(id, async () => {
      await apiFetch(`${base}/${id}`, { method: "DELETE" });
      setCases((cs) => cs.filter((c) => c.id !== id));
    });
  };

  const iconButton = "rounded p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50";

  return (
    <div className="space-y-5">
      <FormError message={error} />

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-2 uppercase">
          <Eye className="size-3.5" aria-hidden /> Sample · {samples.length}
        </h3>
        {samples.length === 0 && (
          <p className="text-xs text-ink-muted">No sample cases. Samples are what the Run button executes.</p>
        )}
        {samples.map((tc, i) =>
          tc.isSample && editing === tc.id ? (
            <div key={tc.id} className="rounded-lg border border-accent/40 p-3">
              <CaseEditor
                initial={tc}
                submitLabel="Save"
                showVisibility={false}
                busy={busy === tc.id}
                onSubmit={({ input, expectedOutput }) => update(tc.id, { input, expectedOutput })}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            tc.isSample && (
              <div key={tc.id} className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-ink-muted">Sample {i + 1}</span>
                  <div className="flex">
                    <button className={iconButton} onClick={() => setEditing(tc.id)} aria-label="Edit sample">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      className={iconButton}
                      disabled={busy === tc.id}
                      onClick={() => update(tc.id, { isSample: false })}
                      aria-label="Make hidden"
                      title="Make hidden"
                    >
                      <EyeOff className="size-4" />
                    </button>
                    <button
                      className={iconButton}
                      disabled={busy === tc.id}
                      onClick={() => remove(tc.id)}
                      aria-label="Delete sample"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[tc.input, tc.expectedOutput].map((text, j) => (
                    <pre
                      key={j}
                      className="max-h-40 overflow-auto rounded-md bg-canvas p-2 font-mono text-xs whitespace-pre-wrap text-ink-2"
                    >
                      {text || <span className="text-ink-muted">(empty)</span>}
                    </pre>
                  ))}
                </div>
              </div>
            )
          ),
        )}
      </div>

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-2 uppercase">
          <Lock className="size-3.5" aria-hidden /> Hidden · {hidden.length}
        </h3>
        <p className="text-xs text-ink-muted">
          Hidden cases stay on the server. Their contents are never sent to the browser, so they can be replaced or
          deleted but not viewed here.
        </p>
        {hidden.map((tc, i) =>
          editing === tc.id ? (
            <div key={tc.id} className="rounded-lg border border-accent/40 p-3">
              <p className="mb-2 text-xs text-ink-muted">Replace hidden case {i + 1}</p>
              <CaseEditor
                submitLabel="Replace"
                showVisibility={false}
                busy={busy === tc.id}
                onSubmit={({ input, expectedOutput }) => update(tc.id, { input, expectedOutput })}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            !tc.isSample && (
              <div key={tc.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                <Lock className="size-4 shrink-0 text-ink-muted" aria-hidden />
                <span className="text-sm">Hidden {i + 1}</span>
                <span className="text-xs text-ink-muted">
                  input {formatBytes(tc.inputBytes)} · output {formatBytes(tc.outputBytes)}
                </span>
                <div className="ml-auto flex">
                  <button className={iconButton} onClick={() => setEditing(tc.id)} aria-label="Replace hidden case">
                    <Pencil className="size-4" />
                  </button>
                  <button
                    className={iconButton}
                    disabled={busy === tc.id}
                    onClick={() => {
                      if (window.confirm("Make this case a visible sample? Its contents will be shown.")) {
                        update(tc.id, { isSample: true });
                      }
                    }}
                    aria-label="Make sample"
                    title="Make sample"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    className={iconButton}
                    disabled={busy === tc.id}
                    onClick={() => remove(tc.id)}
                    aria-label="Delete hidden case"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          ),
        )}
      </div>

      {adding ? (
        <div className="rounded-lg border border-line bg-canvas/40 p-3">
          <p className="mb-2 text-xs font-medium text-ink-2">New test case</p>
          <CaseEditor
            submitLabel="Add test case"
            showVisibility
            busy={busy === "add"}
            onSubmit={add}
            onCancel={cases.length > 0 ? () => setAdding(false) : undefined}
          />
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          Add test case
        </Button>
      )}
    </div>
  );
}
