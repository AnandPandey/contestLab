"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CircleCheck, CloudOff, LoaderCircle, Play, RotateCcw, Send } from "lucide-react";
import { ApiClientError, apiFetch } from "@/lib/client-api";
import { functionStarter, STDIO_STARTERS, type FunctionSpec } from "@/lib/templates";
import type { SubmissionDetail } from "@/lib/judge-types";
import { LANGUAGES } from "@/constants/languages";
import type { Language, ProblemMode } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/form";
import { CodeEditor, type EditorMount } from "./code-editor";
import { SubmissionHistory, submissionsKey } from "./submission-history";
import { ServiceError, SubmissionResult } from "./submission-result";
import { TestCasesPanel, type SampleCase } from "./test-cases-panel";
import { useAutosave, type SaveStatus } from "./use-autosave";
import { ResizeHandle, useResizable } from "./use-resizable";

export type WorkspaceProblem = {
  id: string;
  mode: ProblemMode;
  functionSpec: unknown;
  starterTemplates: unknown;
  sampleTestCases: SampleCase[];
  hiddenTestCount: number;
};

type BottomTab = "tests" | "result" | "submissions";
type RunState = { kind: "RUN" | "SUBMIT"; submissionId?: string; error?: { code: string; message: string } };

const LANG_KEY = "contestlab:language";
const monacoId = (l: Language) => LANGUAGES.find((x) => x.id === l)!.monaco;

function starterFor(problem: WorkspaceProblem, lang: Language) {
  const authored = (problem.starterTemplates as Partial<Record<Language, string>>)?.[lang];
  if (authored?.trim()) return authored;
  const spec = problem.functionSpec as FunctionSpec | null;
  return problem.mode === "FUNCTION" && spec ? functionStarter(spec, lang) : STDIO_STARTERS[lang];
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const map = {
    pending: { icon: null, text: "Unsaved changes" },
    saving: { icon: <LoaderCircle className="size-3.5 animate-spin" aria-hidden />, text: "Saving…" },
    saved: { icon: <CircleCheck className="size-3.5 text-good" aria-hidden />, text: "Saved" },
    error: { icon: <CloudOff className="size-3.5 text-warning" aria-hidden />, text: "Not saved — will retry" },
  } as const;
  const { icon, text } = map[status];
  return (
    <span className="hidden items-center gap-1.5 text-xs text-ink-muted sm:inline-flex" aria-live="polite">
      {icon}
      {text}
    </span>
  );
}

export function Workspace({
  problem,
  savedCode,
  statement,
}: {
  problem: WorkspaceProblem;
  savedCode: Partial<Record<string, string>>;
  statement: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<Language>("CPP");
  // Code an editor model starts from when first created: a loaded submission,
  // else saved code, else the starter. Live edits then live in the Monaco model.
  const [seeded, setSeeded] = useState<Partial<Record<Language, string>>>({});
  const initialCode = (lang: Language) => seeded[lang] ?? savedCode[lang] ?? starterFor(problem, lang);
  // Latest buffer per language, read only from event handlers.
  const codes = useRef<Partial<Record<Language, string>>>({});
  const codeFor = useCallback(
    (lang: Language) => codes.current[lang] ?? savedCode[lang] ?? starterFor(problem, lang),
    [problem, savedCode],
  );
  const monacoRef = useRef<EditorMount[1] | null>(null);
  const { status: saveStatus, queue, flush } = useAutosave(problem.id);

  const [bottomTab, setBottomTab] = useState<BottomTab>("tests");
  const [run, setRun] = useState<RunState | null>(null);
  const [busy, setBusy] = useState<"RUN" | "SUBMIT" | null>(null);
  const [mobileView, setMobileView] = useState<"problem" | "code">("problem");

  const { setContainer: setRowEl, size: leftPct, dragging: draggingX, onPointerDown: startDragX } = useResizable({ storageKey: "contestlab:split-x", initial: 42, min: 25, max: 70, axis: "x" });
  const { setContainer: setColEl, size: editorPct, dragging: draggingY, onPointerDown: startDragY } = useResizable({ storageKey: "contestlab:split-y", initial: 62, min: 25, max: 85, axis: "y" });

  // Restore the last used language (a per-browser preference) after mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY) as Language | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored && LANGUAGES.some((l) => l.id === stored)) setLanguage(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function changeLanguage(lang: Language) {
    setLanguage(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }

  const pathFor = (lang: Language) => `${problem.id}/${lang}.${monacoId(lang)}`;

  /** Replace a language's buffer (keeps it undoable when the model exists) and save it. */
  function replaceCode(lang: Language, code: string) {
    codes.current[lang] = code;
    setSeeded((s) => ({ ...s, [lang]: code }));
    const monaco = monacoRef.current;
    const model = monaco?.editor.getModel(monaco.Uri.parse(pathFor(lang)));
    if (model) model.pushEditOperations([], [{ range: model.getFullModelRange(), text: code }], () => null);
    queue(lang, code);
  }

  function onChange(value: string) {
    codes.current[language] = value;
    queue(language, value);
  }

  function resetCode() {
    if (!window.confirm("Replace your code for this language with the starter template?")) return;
    replaceCode(language, starterFor(problem, language));
  }

  function loadSubmission(s: SubmissionDetail) {
    changeLanguage(s.language);
    replaceCode(s.language, s.code);
    setMobileView("code");
  }

  const execute = useCallback(
    async (kind: "RUN" | "SUBMIT") => {
      if (busy) return;
      setBusy(kind);
      setBottomTab("result");
      setRun({ kind });
      void flush();
      try {
        const { submission } = await apiFetch<{ submission: { id: string } }>("/api/submissions", {
          method: "POST",
          body: { problemId: problem.id, language, code: codeFor(language), kind },
        });
        setRun({ kind, submissionId: submission.id });
        void queryClient.invalidateQueries({ queryKey: submissionsKey(problem.id) });
      } catch (err) {
        setRun({
          kind,
          error:
            err instanceof ApiClientError
              ? { code: err.code, message: err.message }
              : { code: "network_error", message: "Could not reach the server. Check your connection." },
        });
      } finally {
        setBusy(null);
      }
    },
    [busy, codeFor, flush, language, problem.id, queryClient],
  );

  // Editor shortcuts call the latest execute() through a ref.
  const executeRef = useRef(execute);
  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  const onMount = (...[editor, monaco]: EditorMount) => {
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => void executeRef.current("RUN"));
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => void executeRef.current("SUBMIT"),
    );
  };

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-xs transition-colors ${active ? "bg-surface-2 text-ink" : "text-ink-muted hover:text-ink"}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* Small screens: switch between the statement and the editor. */}
      <div role="tablist" className="flex gap-1 border-b border-line px-3 py-2 lg:hidden">
        {(["problem", "code"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={mobileView === v}
            onClick={() => setMobileView(v)}
            className={tabClass(mobileView === v)}
          >
            {v === "problem" ? "Problem" : "Code"}
          </button>
        ))}
      </div>

      <div
        ref={setRowEl}
        className="flex min-h-0 flex-1"
        style={{ "--left": `${leftPct}%` } as React.CSSProperties}
      >
        <div
          className={`${mobileView === "problem" ? "block" : "hidden"} min-w-0 flex-1 overflow-y-auto lg:block lg:w-[var(--left)] lg:flex-none`}
        >
          {statement}
        </div>

        <div className="hidden border-l border-line lg:flex">
          <ResizeHandle
            axis="x"
            dragging={draggingX}
            label="Resize panes"
            onPointerDown={startDragX}
          />
        </div>

        <div
          ref={setColEl}
          className={`${mobileView === "code" ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex ${
            draggingX || draggingY ? "select-none" : ""
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as Language)}
              aria-label="Language"
              className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <Button variant="ghost" className="px-2 py-1.5 text-xs" onClick={resetCode} title="Reset to starter code">
              <RotateCcw className="size-3.5" aria-hidden />
              <span className="sr-only sm:not-sr-only">Reset</span>
            </Button>
            <SaveIndicator status={saveStatus} />
            <div className="ml-auto flex gap-2">
              <Button
                variant="secondary"
                className="py-1.5"
                disabled={busy !== null}
                onClick={() => void execute("RUN")}
                title="Run on sample tests (Ctrl+Enter)"
              >
                {busy === "RUN" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
                Run
              </Button>
              <Button
                className="py-1.5"
                disabled={busy !== null}
                onClick={() => void execute("SUBMIT")}
                title="Submit against all tests (Ctrl+Shift+Enter)"
              >
                {busy === "SUBMIT" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                Submit
              </Button>
            </div>
          </div>

          <div className="min-h-0" style={{ height: `${editorPct}%` }}>
            <CodeEditor
              path={pathFor(language)}
              language={monacoId(language)}
              defaultValue={initialCode(language)}
              onChange={onChange}
              onMount={onMount}
            />
          </div>

          <div className="border-t border-line">
            <ResizeHandle
              axis="y"
              dragging={draggingY}
              label="Resize editor and results"
              onPointerDown={startDragY}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-surface">
            <div role="tablist" className="flex gap-1 border-b border-line px-3 py-1.5">
              {(
                [
                  ["tests", "Test cases"],
                  ["result", "Result"],
                  ["submissions", "Submissions"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={bottomTab === id} onClick={() => setBottomTab(id)} className={tabClass(bottomTab === id)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {bottomTab === "tests" && (
                <TestCasesPanel samples={problem.sampleTestCases} hiddenCount={problem.hiddenTestCount} />
              )}
              {bottomTab === "result" &&
                (run?.error ? (
                  <ServiceError {...run.error} />
                ) : run?.submissionId ? (
                  <SubmissionResult id={run.submissionId} />
                ) : run ? (
                  <p className="flex items-center gap-2 p-4 text-sm text-ink-muted">
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    {run.kind === "RUN" ? "Running on sample tests…" : "Submitting…"}
                  </p>
                ) : (
                  <p className="p-4 text-sm text-ink-muted">
                    Run your code on the samples (Ctrl+Enter) or submit it (Ctrl+Shift+Enter) to see results here.
                  </p>
                ))}
              {bottomTab === "submissions" && <SubmissionHistory problemId={problem.id} onLoadCode={loadSubmission} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
