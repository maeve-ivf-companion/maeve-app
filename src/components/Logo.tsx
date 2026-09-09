import Image from "next/image";

export function Logo({
  className = "",
  showBy = true,
}: {
  className?: string;
  showBy?: boolean;
  /** @deprecated kept for existing call sites; the logo image is always the light/white mark now that the app is dark-themed everywhere. */
  light?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/maeve-logo.png"
        alt="Maeve"
        width={98}
        height={32}
        className="h-8 w-auto"
        priority
      />
      {showBy && (
        <span className="font-display text-xs italic text-white/70">
          by Maman
        </span>
      )}
    </span>
  );
}
