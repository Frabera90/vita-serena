import type { Flow } from "@/lib/storage";
import { Droplet, Droplets, Wind } from "lucide-react";

interface Props {
  value: Flow;
  onChange: (f: Flow) => void;
}

const OPTIONS: { key: NonNullable<Flow>; label: string; sub: string; Icon: typeof Wind }[] = [
  { key: "dry", label: "Nessun flusso", sub: "Secco / nulla", Icon: Wind },
  { key: "spotting", label: "Spotting", sub: "Perdite irregolari", Icon: Droplet },
  { key: "heavy", label: "Flusso abbondante", sub: "Forte / emorragico", Icon: Droplets },
];

export function FlowTracker({ value, onChange }: Props) {
  return (
    <section className="ms-card">
      <header className="mb-4">
        <h2 className="text-xl">Com'è il flusso oggi?</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Nessuna pressione: i cicli irregolari sono normali in perimenopausa.
        </p>
      </header>

      <div className="grid gap-2.5">
        {OPTIONS.map(({ key, label, sub, Icon }) => {
          const selected = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(selected ? null : key)}
              className="flex items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all active:scale-[0.98]"
              style={{
                borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                background: selected
                  ? "color-mix(in oklab, var(--color-primary) 8%, var(--color-card))"
                  : "var(--color-card)",
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: selected ? "var(--color-primary)" : "var(--color-muted)",
                  color: selected ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[15.5px]">{label}</div>
                <div className="text-[13px]" style={{ color: "var(--color-muted-foreground)" }}>
                  {sub}
                </div>
              </div>
              <div
                className="h-5 w-5 rounded-full border-2"
                style={{
                  borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                  background: selected ? "var(--color-primary)" : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
