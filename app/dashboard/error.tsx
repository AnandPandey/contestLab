"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <CircleAlert className="size-8 text-critical" aria-hidden />
      <h1 className="text-lg font-semibold">Couldn&apos;t load the dashboard</h1>
      <p className="text-sm text-ink-muted">
        The database may be unreachable. Check your connection and that DATABASE_URL is set, then
        try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
      >
        Try again
      </button>
    </div>
  );
}
