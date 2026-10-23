"use client";

import { loader } from "@monaco-editor/react";

export const MONACO_THEME = "contestlab-dark";

let ready: Promise<void> | null = null;

/**
 * Loads the locally installed monaco-editor (instead of the default CDN copy) and
 * registers the editor theme. Monaco is large, so it is imported on demand and
 * only by the workspace. Every language here uses Monarch tokenizers, so the
 * generic editor worker is the only worker needed.
 */
export function setupMonaco() {
  ready ??= (async () => {
    const monaco = await import("monaco-editor");
    self.MonacoEnvironment = {
      getWorker: () =>
        new Worker(new URL("monaco-editor/editor/editor.worker.js", import.meta.url), { type: "module" }),
    };
    monaco.editor.defineTheme(MONACO_THEME, {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#141413",
        "editor.lineHighlightBackground": "#1f1f1d",
        "editorLineNumber.foreground": "#5c5b57",
        "editorLineNumber.activeForeground": "#c3c2b7",
        "editorGutter.background": "#141413",
        "editor.selectionBackground": "#3987e555",
        "editorCursor.foreground": "#f0efec",
        "editorWidget.background": "#1a1a19",
        "editorWidget.border": "#383835",
        "scrollbarSlider.background": "#38383580",
      },
    });
    loader.config({ monaco });
  })();
  return ready;
}
