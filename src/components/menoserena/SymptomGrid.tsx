import type { SymptomKey } from "@/lib/storage";

interface Props {
  selected: SymptomKey[];
  onToggle: (k: SymptomKey) => void;
}

export const SYMPTOMS: { key: SymptomKey; emoji: string; label: string; sub: string }[] = [
  { key: "vampata", emoji: "🔥", label: "Vampata / brivido", sub: "Caldo o freddo improvviso" },
  { key: "ansia", emoji: "💭", label: "Ansia improvvisa", sub: "Senza motivo apparente" },
  { key: "nebbia", emoji: "🌫️", label: "Nebbia cerebrale", sub: "Memoria, concentrazione" },
  { key: "prurito", emoji: "✨", label: "Prurito diffuso", sub: "Sul corpo, senza rash" },
  { key: "palpitazioni", emoji: "💓", label: "Palpitazioni", sub: "Cuore che batte forte" },
  { key: "fame", emoji: "🍫", label: "Fame di dolci", sub: "Voglia improvvisa" },
];

export function SymptomGrid({ selected, onToggle }: Props) {
  return (
    <section className="ms-card">
      <header className="mb-4">
        <h2 className="text-xl">Sintomi di oggi</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Tocca tutti quelli che hai. Puoi anche non sceglierne nessuno.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        {SYMPTOMS.map((s) => {
          const isOn = selected.includes(s.key);
          return (
            <button
              key={s.key}
              onClick={() => onToggle(s.key)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3.5 text-left transition-all active:scale-[0.97]"
              style={{
                borderColor: isOn ? "var(--color-accent)" : "var(--color-border)",
                background: isOn
                  ? "color-mix(in oklab, var(--color-accent) 10%, var(--color-card))"
                  : "var(--color-card)",
              }}
            >
              <span className="text-2xl leading-none">{s.emoji}</span>
              <div className="font-semibold text-[14px] leading-tight">{s.label}</div>
              <div className="text-[12px] leading-tight" style={{ color: "var(--color-muted-foreground)" }}>
                {s.sub}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
