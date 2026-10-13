interface Props {
  values: number[];
  className?: string;
}

/** Tiny bar row — no chart library, no SVG. Just 12 divs. */
export function Sparkline({ values, className = '' }: Props) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div className={`flex h-8 items-end gap-1 ${className}`}>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-emerald-500/80"
          style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
          title={`${v}`}
        />
      ))}
    </div>
  );
}
