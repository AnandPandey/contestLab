"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { Button } from "@/components/ui/form";

/** Confirms, calls DELETE on `endpoint`, then navigates to `redirectTo`. */
export function DeleteButton({
  endpoint,
  confirmText,
  redirectTo,
  label = "Delete",
}: {
  endpoint: string;
  confirmText: string;
  redirectTo: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await apiFetch(endpoint, { method: "DELETE" });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      window.alert(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Button variant="danger" onClick={onClick} disabled={busy}>
      <Trash2 className="size-4" aria-hidden />
      {busy ? "Deleting…" : label}
    </Button>
  );
}
