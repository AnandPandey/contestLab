"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { LANGUAGES } from "@/constants/languages";
import type { Language } from "@/app/generated/prisma/enums";
import { Button, monoInputClass } from "@/components/ui/form";

export type Templates = Partial<Record<Language, string>>;

/** Per-language starter code. `generate` returns the default stub for a language. */
export function StarterEditor({
  value,
  onChange,
  generate,
  generateLabel,
}: {
  value: Templates;
  onChange: (v: Templates) => void;
  generate: (language: Language) => string | null;
  generateLabel: string;
}) {
  const [active, setActive] = useState<Language>(LANGUAGES[0].id);

  function fill(languages: Language[], overwrite: boolean) {
    const next = { ...value };
    for (const lang of languages) {
      const code = generate(lang);
      if (code != null && (overwrite || !next[lang]?.trim())) next[lang] = code;
    }
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Starter template language" className="flex gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={active === l.id}
              onClick={() => setActive(l.id)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                active === l.id ? "bg-surface-2 text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {l.label}
              {value[l.id]?.trim() ? "" : " ·"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" className="py-1.5 text-xs" onClick={() => fill([active], true)}>
            <WandSparkles className="size-3.5" aria-hidden />
            {generateLabel}
          </Button>
          <Button
            variant="ghost"
            className="py-1.5 text-xs"
            onClick={() => fill(LANGUAGES.map((l) => l.id), false)}
          >
            Fill empty languages
          </Button>
        </div>
      </div>
      <textarea
        rows={12}
        spellCheck={false}
        value={value[active] ?? ""}
        onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        aria-label={`${LANGUAGES.find((l) => l.id === active)!.label} starter code`}
        placeholder="Starter code shown when this language is first opened"
        className={`${monoInputClass} [tab-size:4]`}
      />
      <p className="text-xs text-ink-muted">Languages marked · have no starter code yet.</p>
    </div>
  );
}
