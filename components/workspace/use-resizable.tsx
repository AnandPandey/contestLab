"use client";

import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";

function readStored(key: string) {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * Size (percent of the container along `axis`) controlled by dragging a handle.
 * Remembered per browser; storage failures are ignored.
 */
export function useResizable({
  storageKey,
  initial,
  min,
  max,
  axis,
}: {
  storageKey: string;
  initial: number;
  min: number;
  max: number;
  axis: "x" | "y";
}) {
  // Callback ref kept in state so render never reads a ref object.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState(initial);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const stored = readStored(storageKey);
    // Restoring a per-browser preference after mount keeps SSR markup deterministic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setSize(Math.min(max, Math.max(min, stored)));
  }, [storageKey, min, max]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!container) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      setDragging(true);
      let latest = size;

      const move = (ev: PointerEvent) => {
        const pct =
          axis === "x"
            ? ((ev.clientX - rect.left) / rect.width) * 100
            : ((ev.clientY - rect.top) / rect.height) * 100;
        latest = Math.min(max, Math.max(min, pct));
        setSize(latest);
      };
      const up = () => {
        setDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        try {
          localStorage.setItem(storageKey, String(Math.round(latest * 10) / 10));
        } catch {
          /* storage unavailable */
        }
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [axis, container, max, min, size, storageKey],
  );

  return { setContainer, size, dragging, onPointerDown };
}

export function ResizeHandle({
  axis,
  dragging,
  label,
  ...props
}: {
  axis: "x" | "y";
  dragging: boolean;
  label: string;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={label}
      className={`group relative shrink-0 touch-none select-none ${
        axis === "x" ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"
      }`}
      {...props}
    >
      <div
        className={`absolute rounded-full transition-colors group-hover:bg-accent/60 ${
          dragging ? "bg-accent" : "bg-transparent"
        } ${axis === "x" ? "inset-y-0 left-0.5 w-0.5" : "inset-x-0 top-0.5 h-0.5"}`}
      />
    </div>
  );
}
