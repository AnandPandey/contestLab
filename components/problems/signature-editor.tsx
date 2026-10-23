"use client";

import { useId } from "react";
import { Plus, X } from "lucide-react";
import { FUNCTION_TYPES, type FunctionType } from "@/constants/languages";
import type { FunctionSpec } from "@/lib/templates";
import { Button, Field, inputClass } from "@/components/ui/form";

function TypeSelect({
  id,
  value,
  onChange,
  label,
}: {
  id?: string;
  value: FunctionType;
  onChange: (t: FunctionType) => void;
  label: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as FunctionType)}
      aria-label={label}
      className={`${inputClass} font-mono`}
    >
      {FUNCTION_TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

export function SignatureEditor({
  value,
  onChange,
  errors,
}: {
  value: FunctionSpec;
  onChange: (v: FunctionSpec) => void;
  errors: Record<string, string>;
}) {
  const uid = useId();
  const fid = (name: string) => `${uid}${name}`;
  const setParam = (i: number, patch: Partial<FunctionSpec["params"][number]>) =>
    onChange({ ...value, params: value.params.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Function name" htmlFor={fid("fn-name")} error={errors["functionSpec.name"]}>
          <input
            id={fid("fn-name")}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="twoSum"
            className={`${inputClass} font-mono`}
            aria-invalid={Boolean(errors["functionSpec.name"])}
          />
        </Field>
        <Field label="Return type" htmlFor={fid("fn-return")}>
          <TypeSelect
            id={fid("fn-return")}
            value={value.returnType}
            onChange={(returnType) => onChange({ ...value, returnType })}
            label="Return type"
          />
        </Field>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2">Parameters</p>
        {value.params.map((p, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <input
                value={p.name}
                onChange={(e) => setParam(i, { name: e.target.value })}
                placeholder="nums"
                aria-label={`Parameter ${i + 1} name`}
                className={`${inputClass} font-mono`}
                aria-invalid={Boolean(errors[`functionSpec.params.${i}.name`])}
              />
              {errors[`functionSpec.params.${i}.name`] && (
                <p className="mt-1 text-xs text-critical">{errors[`functionSpec.params.${i}.name`]}</p>
              )}
            </div>
            <div className="w-36">
              <TypeSelect value={p.type} onChange={(type) => setParam(i, { type })} label={`Parameter ${i + 1} type`} />
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...value, params: value.params.filter((_, j) => j !== i) })}
              className="mt-1.5 rounded p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
              aria-label={`Remove parameter ${i + 1}`}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <Button
          variant="secondary"
          disabled={value.params.length >= 10}
          onClick={() => onChange({ ...value, params: [...value.params, { name: "", type: "int" }] })}
        >
          <Plus className="size-4" aria-hidden />
          Add parameter
        </Button>
      </div>
      <p className="text-xs text-ink-muted">
        Supported types: {FUNCTION_TYPES.join(", ")}. Anything else (trees, graphs, custom classes, 2-D arrays)
        should be a standard input/output problem.
      </p>
    </div>
  );
}
