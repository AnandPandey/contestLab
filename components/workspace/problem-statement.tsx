import Link from "next/link";
import { Clock, Cpu, Pencil } from "lucide-react";
import type { FunctionSpec } from "@/lib/templates";
import type { ProblemMode, Difficulty, SubmissionStatus } from "@/app/generated/prisma/enums";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { StatusBadge } from "@/components/ui/status-badge";

type Example = { input: string; output: string; explanation?: string };

export type StatementProblem = {
  slug: string;
  title: string;
  label: string | null;
  difficulty: Difficulty;
  mode: ProblemMode;
  topics: string[];
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  examples: unknown;
  functionSpec: unknown;
  timeLimitMs: number;
  memoryLimitKb: number;
  contest: { title: string; slug: string } | null;
  state: { solved: boolean; lastStatus: SubmissionStatus | null } | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

const pre =
  "overflow-x-auto rounded-md border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-ink-2";

export function ProblemStatement({ problem }: { problem: StatementProblem }) {
  const examples = (problem.examples as Example[]) ?? [];
  const spec = problem.functionSpec as FunctionSpec | null;

  return (
    <article className="space-y-6 p-5">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            {problem.label && <span className="mr-2 text-ink-muted">{problem.label}.</span>}
            {problem.title}
          </h1>
          <Link
            href={`/problems/${problem.slug}/edit`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.state?.solved ? (
            <StatusBadge status="ACCEPTED" />
          ) : (
            problem.state?.lastStatus && <StatusBadge status={problem.state.lastStatus} />
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {problem.timeLimitMs} ms
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="size-3.5" aria-hidden /> {Math.round(problem.memoryLimitKb / 1024)} MB
          </span>
          {problem.contest && (
            <Link href={`/contests/${problem.contest.slug}`} className="hover:text-ink-2">
              {problem.contest.title}
            </Link>
          )}
        </div>
        {problem.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {problem.topics.map((t) => (
              <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="text-sm leading-relaxed whitespace-pre-wrap text-ink-2">{problem.statement}</div>

      {problem.mode === "FUNCTION" && spec && (
        <Section title="Function">
          <p className="text-xs text-ink-muted">
            Implement this function. Input parsing and output are handled for you.
          </p>
          <pre className={pre}>
            {spec.name}({spec.params.map((p) => `${p.name}: ${p.type}`).join(", ")}) → {spec.returnType}
          </pre>
        </Section>
      )}

      {problem.inputFormat && (
        <Section title="Input">
          <p className="text-sm whitespace-pre-wrap text-ink-2">{problem.inputFormat}</p>
        </Section>
      )}
      {problem.outputFormat && (
        <Section title="Output">
          <p className="text-sm whitespace-pre-wrap text-ink-2">{problem.outputFormat}</p>
        </Section>
      )}

      {examples.map((ex, i) => (
        <Section key={i} title={`Example ${i + 1}`}>
          <div className="space-y-2">
            <div>
              <p className="mb-1 text-xs text-ink-muted">Input</p>
              <pre className={pre}>{ex.input}</pre>
            </div>
            <div>
              <p className="mb-1 text-xs text-ink-muted">Output</p>
              <pre className={pre}>{ex.output}</pre>
            </div>
            {ex.explanation && (
              <p className="text-sm whitespace-pre-wrap text-ink-2">
                <span className="text-ink-muted">Explanation: </span>
                {ex.explanation}
              </p>
            )}
          </div>
        </Section>
      ))}

      {problem.constraints && (
        <Section title="Constraints">
          <pre className={pre}>{problem.constraints}</pre>
        </Section>
      )}
    </article>
  );
}
