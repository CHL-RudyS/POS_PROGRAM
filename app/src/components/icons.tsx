// Phosphor "MagnifyingGlass" (duotone and regular), as used in the design.
const GLASS = "m229.66 218.34-50.07-50.06a88.11 88.11 0 1 0-11.31 11.31l50.06 50.07a8 8 0 0 0 11.32-11.32ZM40 112a72 72 0 1 1 72 72 72.08 72.08 0 0 1-72-72Z";

export function SearchDuotone({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M112 40a72 72 0 1 0 72 72 72 72 0 0 0-72-72Z" opacity="0.2" />
      <path d={GLASS} />
    </svg>
  );
}

export function SearchIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill={color} aria-hidden="true">
      <path d={GLASS} />
    </svg>
  );
}

export function CaretDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-700)" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
