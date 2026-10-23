import {
  Ban,
  CircleAlert,
  CircleCheck,
  CircleX,
  LoaderCircle,
  MemoryStick,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { SubmissionStatus } from "@/app/generated/prisma/enums";

export const STATUS_META: Record<
  SubmissionStatus,
  { label: string; icon: LucideIcon; color: string }
> = {
  PENDING: { label: "Pending", icon: LoaderCircle, color: "text-ink-muted" },
  RUNNING: { label: "Running", icon: LoaderCircle, color: "text-ink-muted" },
  ACCEPTED: { label: "Accepted", icon: CircleCheck, color: "text-good" },
  WRONG_ANSWER: { label: "Wrong Answer", icon: CircleX, color: "text-critical" },
  COMPILATION_ERROR: { label: "Compilation Error", icon: CircleAlert, color: "text-serious" },
  RUNTIME_ERROR: { label: "Runtime Error", icon: TriangleAlert, color: "text-critical" },
  TIME_LIMIT_EXCEEDED: { label: "Time Limit Exceeded", icon: Timer, color: "text-serious" },
  MEMORY_LIMIT_EXCEEDED: { label: "Memory Limit Exceeded", icon: MemoryStick, color: "text-serious" },
  INTERNAL_ERROR: { label: "Judge Error", icon: Ban, color: "text-warning" },
};

/** Verdict: status color on the icon only, label in ink so it never relies on color. */
export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, icon: Icon, color } = STATUS_META[status];
  const spinning = status === "PENDING" || status === "RUNNING";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink">
      <Icon className={`size-3.5 shrink-0 ${color} ${spinning ? "animate-spin" : ""}`} aria-hidden />
      {label}
    </span>
  );
}
