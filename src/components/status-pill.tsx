interface StatusPillProps {
  label: string;
  tone: string;
}

export const StatusPill = ({ label, tone }: StatusPillProps) => {
  const toneClassName =
    tone === "success"
      ? "border-success/20 bg-success/10 text-success"
      : tone === "warning"
        ? "border-warning/20 bg-warning/10 text-warning"
        : "border-border-subtle bg-surface-strong text-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneClassName}`}
    >
      {label}
    </span>
  );
};
