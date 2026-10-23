/** Solved-of-total bar: one hue on a same-ramp track, value stated in text beside it. */
export function Meter({
  value,
  total,
  label,
  className = "",
}: {
  value: number;
  total: number;
  label: string;
  className?: string;
}) {
  const pct = total === 0 ? 0 : Math.min(100, (value / total) * 100);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      title={`${label}: ${value} of ${total} solved`}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-accent-track ${className}`}
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}
