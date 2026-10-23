"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "@/app/generated/prisma/enums";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;

/**
 * Debounced per-language code saving to PUT /api/problems/[id]/code. Pending
 * edits are flushed when the page is hidden or closed (keepalive request), and a
 * failed save is retried with the next edit or flush.
 */
export function useAutosave(problemId: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pending = useRef(new Map<Language, string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endpoint = `/api/problems/${problemId}/code`;

  const flush = useCallback(
    async (keepalive = false) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const batch = [...pending.current.entries()];
      if (batch.length === 0) return true;
      pending.current.clear();
      setStatus("saving");
      try {
        await Promise.all(
          batch.map(async ([language, code]) => {
            const res = await fetch(endpoint, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ language, code }),
              keepalive,
            });
            if (!res.ok) throw new Error(`save failed: ${res.status}`);
          }),
        );
        if (pending.current.size === 0) setStatus("saved");
        return true;
      } catch (err) {
        console.error("[autosave]", err);
        // Re-queue anything newer than what we tried to save.
        for (const [lang, code] of batch) if (!pending.current.has(lang)) pending.current.set(lang, code);
        setStatus("error");
        return false;
      }
    },
    [endpoint],
  );

  const queue = useCallback(
    (language: Language, code: string) => {
      pending.current.set(language, code);
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (pending.current.size > 0) void flush(true);
    };
    const onVisibility = () => document.visibilityState === "hidden" && onHide();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      onHide();
    };
  }, [flush]);

  return { status, queue, flush };
}
