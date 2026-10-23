import type { Metadata } from "next";
import { ContestForm } from "@/components/contests/contest-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "New contest" };

export default function NewContestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader title="New contest" back={{ href: "/contests", label: "Contests" }} />
      <ContestForm />
    </div>
  );
}
