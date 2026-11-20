export default function TopScrim() {
  return (
    <div
      aria-hidden
      data-top-scrim
      className="pointer-events-none absolute inset-x-0 top-0 z-[19] hidden h-[calc(var(--spacing-hud-t)+72px)] bg-gradient-to-b from-black/55 via-black/25 to-transparent max-tablet:block"
    />
  );
}
