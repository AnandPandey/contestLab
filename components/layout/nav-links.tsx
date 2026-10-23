"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contests", label: "Contests" },
];

/** Renders the nav; `pathname` is null in the prerendered shell (no active item). */
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {NAV.map((item) => {
        const active = pathname != null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-ink ${
              active ? "text-ink" : "text-ink-2"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}
