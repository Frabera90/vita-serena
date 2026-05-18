import { Sparkles } from "lucide-react";

export const ACTIVE_REMEDIES = [
  { name: "Integratore Magnesio", day: 12 },
  { name: "Terapia Cognitivo-Comportamentale", day: 5 },
];

export function Remedies() {
  return (
    <section className="ms-card">
      <header className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
        <h2 className="text-xl">Cosa stai usando</h2>
      </header>

      <ul className="flex flex-col gap-2">
        {ACTIVE_REMEDIES.map((r) => (
          <li
            key={r.name}
            className="flex items-center justify-between rounded-xl px-3.5 py-3"
            style={{ background: "var(--color-muted)" }}
          >
            <span className="font-medium text-[14.5px]">{r.name}</span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
              style={{
                background: "var(--color-terracotta-soft)",
                color: "var(--color-accent)",
              }}
            >
              Giorno {r.day}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[12.5px]" style={{ color: "var(--color-muted-foreground)" }}>
        Aggiungere i tuoi rimedi sarà disponibile presto.
      </p>
    </section>
  );
}
