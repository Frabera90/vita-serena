import { Moon } from "lucide-react";
import type { SleepData, SleepDisturbance } from "@/lib/storage";

const QUALITY_EMOJIS = ["", "😩", "😔", "😐", "😊", "😴"];
const QUALITY_LABELS = ["", "Pessimo", "Scarso", "Discreto", "Buono", "Ottimo"];

const DISTURBANCES: { key: SleepDisturbance; label: string; sub: string }[] = [
  { key: "falling_asleep", label: "Difficile addormentarsi", sub: "Ci vuole più di 30 min" },
  { key: "waking_up", label: "Risvegli notturni", sub: "Mi sveglio più volte" },
  { key: "early_waking", label: "Sveglia troppo presto", sub: "Non riesco a riaddormentarmi" },
  { key: "restless", label: "Sonno agitato", sub: "Mi giro, non riposo davvero" },
];

interface Props {
  sleep: SleepData;
  onChange: (sleep: SleepData) => void;
}

export function SleepTracker({ sleep, onChange }: Props) {
  const toggleDisturbance = (d: SleepDisturbance) => {
    const has = sleep.disturbances.includes(d);
    onChange({
      ...sleep,
      disturbances: has
        ? sleep.disturbances.filter((x) => x !== d)
        : [...sleep.disturbances, d],
    });
  };

  const setHours = (h: number) => onChange({ ...sleep, hours: h });
  const setQuality = (q: number) =>
    onChange({ ...sleep, quality: sleep.quality === q ? null : (q as SleepData["quality"]) });

  return (
    <section className="ms-card">
      <header className="mb-4 flex items-center gap-2">
        <Moon className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
        <h2 className="text-xl">Sonno di stanotte</h2>
      </header>

      {/* Hours */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Ore dormite</span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: "var(--color-primary)" }}
          >
            {sleep.hours !== null ? `${sleep.hours}h` : "—"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={sleep.hours ?? 7}
          onChange={(e) => setHours(parseFloat(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--color-primary)" }}
        />
        <div
          className="flex justify-between text-[11px] mt-1"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <span>0h</span>
          <span>4h</span>
          <span>8h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Quality */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2">Qualità del sonno</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setQuality(v)}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-[11px] font-semibold transition-all active:scale-95"
              style={{
                borderColor:
                  sleep.quality === v ? "var(--color-primary)" : "var(--color-border)",
                background:
                  sleep.quality === v
                    ? "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))"
                    : "var(--color-card)",
              }}
            >
              <span className="text-lg leading-none">{QUALITY_EMOJIS[v]}</span>
              <span
                style={{
                  color:
                    sleep.quality === v
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)",
                }}
              >
                {QUALITY_LABELS[v]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Disturbances */}
      <div>
        <p className="text-sm font-medium mb-2">Problemi stanotte</p>
        <div className="grid grid-cols-2 gap-2">
          {DISTURBANCES.map((d) => {
            const isOn = sleep.disturbances.includes(d.key);
            return (
              <button
                key={d.key}
                onClick={() => toggleDisturbance(d.key)}
                className="flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.97]"
                style={{
                  borderColor: isOn ? "var(--color-primary)" : "var(--color-border)",
                  background: isOn
                    ? "color-mix(in oklab, var(--color-primary) 10%, var(--color-card))"
                    : "var(--color-card)",
                }}
              >
                <div className="font-semibold text-[13px] leading-tight">{d.label}</div>
                <div
                  className="text-[11.5px] leading-tight"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {d.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
