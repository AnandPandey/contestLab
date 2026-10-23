"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { MONACO_THEME, setupMonaco } from "./monaco-setup";

export type EditorMount = Parameters<OnMount>;

/**
 * Monaco editor bound to one model per `path`, so each language keeps its own
 * buffer and undo history. Falls back to a plain textarea if Monaco cannot load.
 */
export function CodeEditor({
  path,
  language,
  defaultValue,
  onChange,
  onMount,
}: {
  path: string;
  language: string;
  defaultValue: string;
  onChange: (value: string) => void;
  onMount?: OnMount;
}) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    setupMonaco().then(
      () => !cancelled && setState("ready"),
      (err) => {
        console.error("[editor] Monaco failed to load", err);
        if (!cancelled) setState("failed");
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-muted">
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      Loading editor…
    </div>
  );

  if (state === "loading") return loading;

  if (state === "failed") {
    return (
      <div className="flex h-full flex-col">
        <p className="border-b border-line px-3 py-1.5 text-xs text-warning">
          The code editor failed to load; using a plain text area. Your code is still saved.
        </p>
        <textarea
          key={path}
          defaultValue={defaultValue}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-label="Code"
          className="min-h-0 flex-1 resize-none bg-[#141413] p-3 font-mono text-[13px] text-ink focus:outline-none [tab-size:4]"
        />
      </div>
    );
  }

  return (
    <Editor
      path={path}
      language={language}
      defaultValue={defaultValue}
      theme={MONACO_THEME}
      loading={loading}
      onChange={(v) => onChange(v ?? "")}
      onMount={onMount}
      options={{
        fontSize: 14,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        padding: { top: 12 },
        renderLineHighlight: "line",
        smoothScrolling: true,
        fixedOverflowWidgets: true,
      }}
    />
  );
}
