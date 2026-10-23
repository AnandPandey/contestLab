"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { ApiClientError, apiFetch, errorMessage } from "@/lib/client-api";
import { fromLocalInput, toLocalInput } from "@/lib/dates";
import { Button, ButtonLink, Field, FormError, inputClass } from "@/components/ui/form";

export type ContestFormValues = {
  id?: string;
  slug?: string;
  title: string;
  platform: string | null;
  url: string | null;
  description: string | null;
  startTime: Date | null;
  endTime: Date | null;
};

export function ContestForm({ initial }: { initial?: ContestFormValues }) {
  const router = useRouter();
  // Ids must be unique: Next keeps the previous route mounted (hidden) during navigation.
  const uid = useId();
  const fid = (name: string) => `${uid}${name}`;
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    platform: initial?.platform ?? "",
    url: initial?.url ?? "",
    description: initial?.description ?? "",
    startTime: toLocalInput(initial?.startTime),
    endTime: toLocalInput(initial?.endTime),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const body = {
      title: form.title,
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      platform: form.platform || null,
      url: form.url.trim() || null,
      description: form.description || null,
      startTime: fromLocalInput(form.startTime),
      endTime: fromLocalInput(form.endTime),
    };
    try {
      const { contest } = await apiFetch<{ contest: { slug: string } }>(
        editing ? `/api/contests/${initial!.id}` : "/api/contests",
        { method: editing ? "PATCH" : "POST", body },
      );
      router.push(`/contests/${contest.slug}`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiClientError) setFieldErrors(err.fieldErrors());
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-line bg-surface p-5">
      <FormError message={error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor={fid("title")} error={fieldErrors.title} className="sm:col-span-2">
          <input
            id={fid("title")}
            required
            maxLength={200}
            value={form.title}
            onChange={set("title")}
            placeholder="Weekly Contest 412"
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.title)}
          />
        </Field>
        <Field label="Platform" htmlFor={fid("platform")} error={fieldErrors.platform}>
          <input
            id={fid("platform")}
            maxLength={100}
            value={form.platform}
            onChange={set("platform")}
            placeholder="Codeforces, LeetCode, AtCoder…"
            className={inputClass}
          />
        </Field>
        <Field
          label="URL slug"
          htmlFor={fid("slug")}
          error={fieldErrors.slug}
          hint={editing ? "Changing it changes the page address." : "Leave blank to generate from the title."}
        >
          <input
            id={fid("slug")}
            value={form.slug}
            onChange={set("slug")}
            placeholder="weekly-contest-412"
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.slug)}
          />
        </Field>
        <Field label="Original contest URL" htmlFor={fid("url")} error={fieldErrors.url} className="sm:col-span-2">
          <input
            id={fid("url")}
            type="url"
            value={form.url}
            onChange={set("url")}
            placeholder="https://…"
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.url)}
          />
        </Field>
        <Field label="Start time" htmlFor={fid("startTime")} error={fieldErrors.startTime}>
          <input
            id={fid("startTime")}
            type="datetime-local"
            value={form.startTime}
            onChange={set("startTime")}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </Field>
        <Field label="End time" htmlFor={fid("endTime")} error={fieldErrors.endTime}>
          <input
            id={fid("endTime")}
            type="datetime-local"
            value={form.endTime}
            onChange={set("endTime")}
            className={`${inputClass} [color-scheme:dark]`}
            aria-invalid={Boolean(fieldErrors.endTime)}
          />
        </Field>
        <Field label="Description" htmlFor={fid("description")} className="sm:col-span-2">
          <textarea
            id={fid("description")}
            rows={4}
            value={form.description}
            onChange={set("description")}
            placeholder="Notes about this contest (optional)"
            className={inputClass}
          />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <ButtonLink variant="ghost" href={editing ? `/contests/${initial!.slug}` : "/contests"}>
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Create contest"}
        </Button>
      </div>
    </form>
  );
}
