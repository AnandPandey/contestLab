import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted " +
  "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 " +
  "aria-[invalid=true]:border-critical";

export const monoInputClass = `${inputClass} font-mono text-[13px] leading-relaxed`;

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-critical">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-line-strong bg-surface-2 text-ink hover:border-ink-muted",
  danger: "border border-critical/50 text-critical hover:bg-critical/10",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
};

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium " +
  "transition-colors disabled:pointer-events-none disabled:opacity-50";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={`${buttonBase} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonBase} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-ink">
      {message}
    </p>
  );
}
