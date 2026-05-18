import { Activity, Coffee, Droplets, Wine } from "lucide-react";
import type { ActivityLevel, ContextData, WaterLevel } from "@/lib/storage";

const STRESS_EMOJIS = ["", "😌", "🙂", "😐", "😟", "😩"];
const STRESS_LABELS = ["", "Calma", "Ok", "Un po'", "Tanto", "Enorme"];

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; emoji: string }[] = [
  { key: "none", label: "Nulla", emoji: "🛋️" },
  { key: "light", label: "Leggera", emoji: "🚶" },
  { key: "moderate", label: "Moderata", emoji: "🚴" },
  { key: "intense", label: "Intensa", emoji: "🏃" },
];

const WATER_OPTIONS: { key: WaterLevel; label: string; emoji: string }[] = [
  { key: "low", label: "Poca", emoji: "🌵" },
  { key: "medium", label: "Media", emoji: "💧" },
  { key: "high", label: "Tanta", emoji: "🚿" },
];

interface Props {
  weight: number | null;
  context: ContextData;
  onWeightChange: (w: number | null) => void;
  onContextChange: (c: ContextData) => void;
}

export function DailyWellness({ weight, context, onWeightChange, onContextChange }: Props) {
  const set = <K extends keyof ContextData>(k: K, v: ContextData[K]) =>
    onContextChange({ ...context, [k]: v });

  const adjustWeight = (delta: number) => {
    const base = weight ?? 60;
    const next = Math.round((base + delta) * 10) / 10;
    onWeightChange(Math.max(30, Math.min(200, next)));
  };

  return (
    <section className="ms-card">
      <header className="mb-4">
        <h2 className="text-xl">Benessere generale</h2>
      </header>

      {/* Weight */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2">Peso (opzionale)</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustWeight(-0.1)}
            className="h-9 w-9 rounded-full text-lg font-bold flex items-center justify-center transition-all active:scale-90"
            style={{ background: "var(--color-muted)", color: "var(--color-foreground)" }}
          >
            −
          </button>
          <div className="flex-1 text-center">
            {weight !== null ? (
              <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                {weight.toFixed(1)} <span className="text-base font-medium">kg</span>
              </span>
            ) : (
              <button
                onClick={() => onWeightChange(60)}
                className="text-sm underline underline-offset-2"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Tocca − o + per registrare
              </button>
            )}
          </div>
          <button
            onClick={() => adjustWeight(0.1)}
            className="h-9 w-9 rounded-full text-lg font-bold flex items-center justify-center transition-all active:scale-90"
            style={{ background: "var(--color-muted)", color: "var(--color-foreground)" }}
          >
            +
          </button>
          {weight !== null && (
            <button
              onClick={() => onWeightChange(null)}
              className="text-xs underline underline-offset-2"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              reset
            </button>
          )}
        </div>
      </div>

      {/* Stress */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2">Livello di stress</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() =>
                set("stressLevel", context.stressLevel === v ? null : (v as ContextData["stressLevel"]))
              }
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-[11px] font-semibold transition-all active:scale-95"
              style={{
                borderColor:
                  context.stressLevel === v ? "var(--color-accent)" : "var(--color-border)",
                background:
                  context.stressLevel === v
                    ? "color-mix(in oklab, var(--color-accent) 12%, var(--color-card))"
                    : "var(--color-card)",
              }}
            >
              <span className="text-lg leading-none">{STRESS_EMOJIS[v]}</span>
              <span
                style={{
                  color:
                    context.stressLevel === v
                      ? "var(--color-accent)"
                      : "var(--color-muted-foreground)",
                }}
              >
                {STRESS_LABELS[v]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
          <p className="text-sm font-medium">Attività fisica</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {ACTIVITY_OPTIONS.map((o) => {
            const isOn = context.activity === o.key;
            return (
              <button
                key={o.key}
                onClick={() => set("activity", isOn ? null : o.key)}
                className="flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  borderColor: isOn ? "var(--color-primary)" : "var(--color-border)",
                  background: isOn
                    ? "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))"
                    : "var(--color-card)",
                }}
              >
                <span className="text-base leading-none">{o.emoji}</span>
                <span
                  style={{
                    color: isOn ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  }}
                >
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Water */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Droplets className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
          <p className="text-sm font-medium">Acqua bevuta</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {WATER_OPTIONS.map((o) => {
            const isOn = context.water === o.key;
            return (
              <button
                key={o.key}
                onClick={() => set("water", isOn ? null : o.key)}
                className="flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  borderColor: isOn ? "var(--color-primary)" : "var(--color-border)",
                  background: isOn
                    ? "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))"
                    : "var(--color-card)",
                }}
              >
                <span className="text-base leading-none">{o.emoji}</span>
                <span
                  style={{
                    color: isOn ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  }}
                >
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caffeine & Alcohol */}
      <div>
        <p className="text-sm font-medium mb-2">Trigger oggi</p>
        <div className="flex gap-2">
          <button
            onClick={() => set("caffeine", !context.caffeine)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{
              borderColor: context.caffeine ? "var(--color-accent)" : "var(--color-border)",
              background: context.caffeine
                ? "color-mix(in oklab, var(--color-accent) 12%, var(--color-card))"
                : "var(--color-card)",
            }}
          >
            <Coffee className="h-4 w-4" />
            Caffeina
          </button>
          <button
            onClick={() => set("alcohol", !context.alcohol)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{
              borderColor: context.alcohol ? "var(--color-accent)" : "var(--color-border)",
              background: context.alcohol
                ? "color-mix(in oklab, var(--color-accent) 12%, var(--color-card))"
                : "var(--color-card)",
            }}
          >
            <Wine className="h-4 w-4" />
            Alcol
          </button>
        </div>
      </div>
    </section>
  );
}
