import Link from "next/link";
import type { ProblemFilters as Filters } from "@/lib/problems";
import { Difficulty } from "@/app/generated/prisma/enums";
import { DIFFICULTY_META } from "@/components/ui/difficulty-badge";

type Key = "difficulty" | "topic" | "status";

function hrefWith(filters: Filters, key: Key, value?: string) {
  const params = new URLSearchParams();
  const next = { ...filters, [key]: value };
  for (const k of ["difficulty", "topic", "status"] as const) {
    if (next[k]) params.set(k, next[k]);
  }
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-accent/60 bg-accent/15 text-ink"
          : "border-line text-ink-2 hover:border-line-strong hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="w-20 shrink-0 pt-1 text-xs text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

const STATUSES = [
  { value: "solved", label: "Solved" },
  { value: "attempted", label: "Attempted" },
  { value: "unattempted", label: "Not attempted" },
] as const;

export function ProblemFilters({
  filters,
  topics,
}: {
  filters: Filters;
  topics: { topic: string; total: number }[];
}) {
  return (
    <div className="space-y-2 border-b border-line px-4 py-3">
      <Row label="Difficulty">
        <Chip href={hrefWith(filters, "difficulty")} active={!filters.difficulty}>
          All
        </Chip>
        {Object.values(Difficulty).map((d) => (
          <Chip key={d} href={hrefWith(filters, "difficulty", d)} active={filters.difficulty === d}>
            <span className={`size-2 rounded-full ${DIFFICULTY_META[d].dot}`} aria-hidden />
            {DIFFICULTY_META[d].label}
          </Chip>
        ))}
      </Row>
      <Row label="Status">
        <Chip href={hrefWith(filters, "status")} active={!filters.status}>
          All
        </Chip>
        {STATUSES.map((s) => (
          <Chip key={s.value} href={hrefWith(filters, "status", s.value)} active={filters.status === s.value}>
            {s.label}
          </Chip>
        ))}
      </Row>
      <Row label="Topic">
        <Chip href={hrefWith(filters, "topic")} active={!filters.topic}>
          All
        </Chip>
        {topics.length === 0 && <span className="text-xs text-ink-muted">No topics yet</span>}
        {topics.map((t) => (
          <Chip key={t.topic} href={hrefWith(filters, "topic", t.topic)} active={filters.topic === t.topic}>
            {t.topic}
            <span className="text-ink-muted">{t.total}</span>
          </Chip>
        ))}
      </Row>
    </div>
  );
}
