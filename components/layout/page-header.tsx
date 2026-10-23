import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{title}</h1>
          {description && <div className="mt-1 text-sm text-ink-muted">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
