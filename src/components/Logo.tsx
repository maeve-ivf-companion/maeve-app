export function Logo({
  className = "",
  showBy = true,
  light = false,
}: {
  className?: string;
  showBy?: boolean;
  light?: boolean;
}) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span
        className="font-display text-2xl font-semibold tracking-tight"
        style={{ color: light ? "#fff" : undefined }}
      >
        <span className={light ? "" : "text-gradient"}>Maeve</span>
      </span>
      {showBy && (
        <span
          className={`font-display text-xs italic ${
            light ? "text-white/70" : "text-faint"
          }`}
        >
          by Maman
        </span>
      )}
    </span>
  );
}
