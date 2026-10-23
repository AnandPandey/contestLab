"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { ApiClientError, apiFetch, errorMessage } from "@/lib/client-api";
import { functionStarter, STDIO_STARTERS, type FunctionSpec } from "@/lib/templates";
import { Difficulty, ProblemMode, type Language } from "@/app/generated/prisma/enums";
import { DIFFICULTY_META } from "@/components/ui/difficulty-badge";
import { Button, ButtonLink, Field, FormError, inputClass } from "@/components/ui/form";
import { ExamplesEditor, type Example } from "./examples-editor";
import { SignatureEditor } from "./signature-editor";
import { StarterEditor, type Templates } from "./starter-editor";

export type ProblemFormValues = {
  id: string;
  slug: string;
  contestId: string | null;
  label: string | null;
  order: number;
  title: string;
  difficulty: Difficulty;
  mode: ProblemMode;
  topics: string[];
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  examples: Example[];
  functionSpec: FunctionSpec | null;
  starterTemplates: Templates;
  timeLimitMs: number;
  memoryLimitKb: number;
};

const EMPTY_SPEC: FunctionSpec = { name: "", params: [{ name: "", type: "int" }], returnType: "int" };

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="border-b border-line px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

export function ProblemForm({
  initial,
  contests,
  defaultContestId,
  cancelHref,
}: {
  initial?: ProblemFormValues;
  contests: { id: string; title: string }[];
  defaultContestId?: string | null;
  cancelHref: string;
}) {
  const router = useRouter();
  // Ids must be unique: Next keeps the previous route mounted (hidden) during navigation.
  const uid = useId();
  const fid = (name: string) => `${uid}${name}`;
  const editing = Boolean(initial);
  const [form, setForm] = useState({
    contestId: initial?.contestId ?? defaultContestId ?? "",
    label: initial?.label ?? "",
    order: String(initial?.order ?? 0),
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    difficulty: initial?.difficulty ?? Difficulty.MEDIUM,
    mode: initial?.mode ?? ProblemMode.STDIN_STDOUT,
    topics: initial?.topics.join(", ") ?? "",
    statement: initial?.statement ?? "",
    inputFormat: initial?.inputFormat ?? "",
    outputFormat: initial?.outputFormat ?? "",
    constraints: initial?.constraints ?? "",
    timeLimitMs: String(initial?.timeLimitMs ?? 2000),
    memoryLimitMb: String(Math.round((initial?.memoryLimitKb ?? 262144) / 1024)),
  });
  const [examples, setExamples] = useState<Example[]>(initial?.examples ?? []);
  const [spec, setSpec] = useState<FunctionSpec>(initial?.functionSpec ?? EMPTY_SPEC);
  const [templates, setTemplates] = useState<Templates>(initial?.starterTemplates ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };
  const isFunction = form.mode === ProblemMode.FUNCTION;

  function generateStarter(language: Language) {
    if (!isFunction) return STDIO_STARTERS[language];
    if (!spec.name.trim()) return null;
    return functionStarter({ ...spec, params: spec.params.filter((p) => p.name.trim()) }, language);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    setFieldErrors({});

    const body = {
      contestId: form.contestId || null,
      label: form.label || null,
      order: Number(form.order) || 0,
      title: form.title,
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      difficulty: form.difficulty,
      mode: form.mode,
      topics: [...new Set(form.topics.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))],
      statement: form.statement,
      inputFormat: form.inputFormat || null,
      outputFormat: form.outputFormat || null,
      constraints: form.constraints || null,
      examples: examples.map((ex) => ({ ...ex, explanation: ex.explanation?.trim() || undefined })),
      functionSpec: isFunction ? spec : null,
      starterTemplates: Object.fromEntries(Object.entries(templates).filter(([, code]) => code?.trim())),
      timeLimitMs: Number(form.timeLimitMs),
      memoryLimitKb: Math.round(Number(form.memoryLimitMb) * 1024),
    };

    try {
      if (editing) {
        const { problem } = await apiFetch<{ problem: { slug: string } }>(`/api/problems/${initial!.id}`, {
          method: "PATCH",
          body,
        });
        setSaved(true);
        setSaving(false);
        if (problem.slug !== initial!.slug) router.replace(`/problems/${problem.slug}/edit`);
        router.refresh();
      } else {
        const { problem } = await apiFetch<{ problem: { slug: string } }>("/api/problems", {
          method: "POST",
          body,
        });
        router.push(`/problems/${problem.slug}/edit#test-cases`);
        router.refresh();
      }
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiClientError) setFieldErrors(err.fieldErrors());
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormError message={error} />

      <Section title="Basics">
        <div className="grid gap-5 sm:grid-cols-6">
          <Field label="Title" htmlFor={fid("title")} error={fieldErrors.title} className="sm:col-span-4">
            <input
              id={fid("title")}
              required
              maxLength={200}
              value={form.title}
              onChange={set("title")}
              placeholder="Two Sum"
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.title)}
            />
          </Field>
          <Field
            label="URL slug"
            htmlFor={fid("slug")}
            error={fieldErrors.slug}
            hint={editing ? undefined : "Blank = from title"}
            className="sm:col-span-2"
          >
            <input id={fid("slug")} value={form.slug} onChange={set("slug")} className={inputClass} />
          </Field>
          <Field label="Contest" htmlFor={fid("contestId")} className="sm:col-span-4">
            <select id={fid("contestId")} value={form.contestId} onChange={set("contestId")} className={inputClass}>
              <option value="">No contest (standalone)</option>
              {contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Label" htmlFor={fid("label")} hint="e.g. A, B1" className="sm:col-span-1">
            <input id={fid("label")} maxLength={10} value={form.label} onChange={set("label")} className={inputClass} />
          </Field>
          <Field label="Order" htmlFor={fid("order")} hint="Sort position" className="sm:col-span-1">
            <input
              id={fid("order")}
              type="number"
              min={0}
              max={10000}
              value={form.order}
              onChange={set("order")}
              className={inputClass}
            />
          </Field>
          <Field label="Difficulty" htmlFor={fid("difficulty")} className="sm:col-span-2">
            <select id={fid("difficulty")} value={form.difficulty} onChange={set("difficulty")} className={inputClass}>
              {Object.values(Difficulty).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_META[d].label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Topics"
            htmlFor={fid("topics")}
            hint="Comma-separated, e.g. dp, graphs"
            error={fieldErrors.topics}
            className="sm:col-span-4"
          >
            <input id={fid("topics")} value={form.topics} onChange={set("topics")} className={inputClass} />
          </Field>
          <Field label="Time limit (ms)" htmlFor={fid("timeLimitMs")} error={fieldErrors.timeLimitMs} className="sm:col-span-3">
            <input
              id={fid("timeLimitMs")}
              type="number"
              min={100}
              max={15000}
              step={100}
              required
              value={form.timeLimitMs}
              onChange={set("timeLimitMs")}
              className={inputClass}
            />
          </Field>
          <Field
            label="Memory limit (MB)"
            htmlFor={fid("memoryLimitMb")}
            error={fieldErrors.memoryLimitKb}
            className="sm:col-span-3"
          >
            <input
              id={fid("memoryLimitMb")}
              type="number"
              min={16}
              max={512}
              required
              value={form.memoryLimitMb}
              onChange={set("memoryLimitMb")}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Statement">
        <Field label="Problem statement" htmlFor={fid("statement")} error={fieldErrors.statement}>
          <textarea
            id={fid("statement")}
            required
            rows={10}
            value={form.statement}
            onChange={set("statement")}
            placeholder="Describe the task. Plain text; line breaks are preserved."
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.statement)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Input format" htmlFor={fid("inputFormat")}>
            <textarea id={fid("inputFormat")} rows={4} value={form.inputFormat} onChange={set("inputFormat")} className={inputClass} />
          </Field>
          <Field label="Output format" htmlFor={fid("outputFormat")}>
            <textarea
              id={fid("outputFormat")}
              rows={4}
              value={form.outputFormat}
              onChange={set("outputFormat")}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Constraints" htmlFor={fid("constraints")}>
          <textarea
            id={fid("constraints")}
            rows={4}
            value={form.constraints}
            onChange={set("constraints")}
            placeholder={"1 <= n <= 10^5\n-10^9 <= a[i] <= 10^9"}
            className={`${inputClass} font-mono text-[13px]`}
          />
        </Field>
      </Section>

      <Section title="Examples">
        <ExamplesEditor
          value={examples}
          onChange={(v) => {
            setSaved(false);
            setExamples(v);
          }}
        />
      </Section>

      <Section
        title="Solution format"
        description="Function mode: the user writes one function and the judge supplies the I/O harness. Standard I/O: the user writes a full program."
      >
        <div role="radiogroup" aria-label="Problem mode" className="grid gap-2 sm:grid-cols-2">
          {[
            { value: ProblemMode.STDIN_STDOUT, title: "Standard input / output", body: "Full program reads stdin, writes stdout." },
            { value: ProblemMode.FUNCTION, title: "Function (LeetCode style)", body: "Implement a single function signature." },
          ].map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                form.mode === m.value ? "border-accent/60 bg-accent/10" : "border-line hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={form.mode === m.value}
                onChange={set("mode")}
                className="sr-only"
              />
              <span className="block text-sm font-medium">{m.title}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">{m.body}</span>
            </label>
          ))}
        </div>
        {isFunction && (
          <SignatureEditor
            value={spec}
            errors={fieldErrors}
            onChange={(v) => {
              setSaved(false);
              setSpec(v);
            }}
          />
        )}
      </Section>

      <Section title="Starter code" description="Shown in the editor the first time a language is opened.">
        <StarterEditor
          value={templates}
          onChange={(v) => {
            setSaved(false);
            setTemplates(v);
          }}
          generate={generateStarter}
          generateLabel={isFunction ? "Generate from signature" : "Insert default template"}
        />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        {saved && (
          <span className="mr-auto inline-flex items-center gap-1.5 text-sm text-ink-2">
            <CircleCheck className="size-4 text-good" aria-hidden />
            Saved
          </span>
        )}
        <ButtonLink variant="ghost" href={cancelHref}>
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save problem" : "Create problem"}
        </Button>
      </div>
    </form>
  );
}
