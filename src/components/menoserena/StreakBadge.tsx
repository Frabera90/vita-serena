import { calcStreak } from "@/lib/storage";

export function StreakBadge() {
  const streak = calcStreak();
  if (streak === 0) return null;

  const label =
    streak === 1
      ? "1 giorno di fila"
      : streak >= 3
      ? `${streak} giorni 🌱`
      : `${streak} giorni di fila`;

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{
        background: "color-mix(in oklab, var(--color-primary) 14%, var(--color-card))",
        color: "var(--color-sage-deep, var(--color-primary))",
        border: "1px solid color-mix(in oklab, var(--color-primary) 20%, transparent)",
      }}
    >
      {label}
    </span>
  );
}
