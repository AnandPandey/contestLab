import Link from "next/link";
import { CodeXml, Plus } from "lucide-react";
import { Suspense } from "react";
import { NavLinks, NavList } from "./nav-links";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-accent/15 text-accent">
            <CodeXml className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">ContestLab</span>
        </Link>
        <Suspense fallback={<NavList pathname={null} />}>
          <NavLinks />
        </Suspense>
        <Link
          href="/problems/new"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">New problem</span>
          <span className="sr-only sm:hidden">New problem</span>
        </Link>
      </div>
    </header>
  );
}
