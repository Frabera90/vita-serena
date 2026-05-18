import { useState } from "react";
import { Moon, Sun, Sunset, Coffee } from "lucide-react";
import { type DayEntry, type SleepData, type SymptomKey } from "@/lib/storage";

type TimeSlot = "night" | "morning" | "afternoon" | "evening";

function getSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "evening";
}

function getTimeLabel(): string {
  const now = new Date();
  return now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatItalianDate(d: Date): string {
  return d
    .toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Night quick-log: most common nighttime symptoms
const NIGHT_SYMPTOMS: SymptomKey[] = [
  "vampata",
  "sudorazione_notturna",
  "ansia",
  "palpitazioni",
  "nebbia",
  "scosse_elettriche",
];
const NIGHT_LABELS: Partial<Record<SymptomKey, { emoji: string; label: string }>> = {
  vampata: { emoji: "🌡️", label: "Vampata" },
  sudorazione_notturna: { emoji: "💦", label: "Sudorazione" },
  ansia: { emoji: "😰", label: "Ansia" },
  palpitazioni: { emoji: "💓", label: "Palpitaz." },
  nebbia: { emoji: "🧠", label: "Nebbia" },
  scosse_elettriche: { emoji: "⚡", label: "Scosse" },
};

interface Props {
  name: string | null;
  entry: DayEntry;
  onToggle: (k: SymptomKey) => void;
  onSleepChange: (s: SleepData) => void;
}

export function ContextualGreeting({ name, entry, onToggle, onSleepChange }: Props) {
  const slot = getSlot();
  const firstName = name?.trim().split(" ")[0] ?? null;
  const [nightDone, setNightDone] = useState(false);

  // ── NIGHT ──────────────────────────────────────────────────────────────────
  if (slot === "night" && !nightDone) {
    const hoursSlept = entry.sleep.hours ?? 0;

    return (
      <div
        className="rounded-2xl px-5 py-5 mb-1"
        style={{
          background: "color-mix(in oklab, var(--color-primary) 10%, var(--color-card))",
          border: "1px solid color-mix(in oklab, var(--color-primary) 20%, transparent)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Moon className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
          <span className="text-[11.5px] font-semibold tracking-wide uppercase"
            style={{ color: "var(--color-primary)" }}>
            {getTimeLabel()} · Notte
          </span>
        </div>

        <h2 className="text-[22px] leading-snug mb-1">
          {firstName ? `Ehi ${firstName},` : "Ehi,"} non riesci<br />a dormire?
        </h2>
        <p className="text-[13px] mb-4" style={{ color: "var(--color-muted-foreground)" }}>
          Prenditi 10 secondi. Registra e torna a riposarti.
        </p>

        {/* Quick symptom grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {NIGHT_SYMPTOMS.map((k) => {
            const meta = NIGHT_LABELS[k];
            if (!meta) return null;
            const on = entry.symptoms.includes(k);
            return (
              <button
                key={k}
                onClick={() => onToggle(k)}
                className="flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all active:scale-95"
                style={{
                  background: on
                    ? "var(--color-primary)"
                    : "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))",
                  border: `1.5px solid ${on ? "var(--color-primary)" : "transparent"}`,
                }}
              >
                <span className="text-xl leading-none">{meta.emoji}</span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: on ? "white" : "var(--color-foreground)" }}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hours slept so far */}
        <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4"
          style={{ background: "var(--color-muted)" }}>
          <span className="text-[13.5px] font-medium">
            💤 Ore dormite finora
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSleepChange({ ...entry.sleep, hours: Math.max(0, hoursSlept - 0.5) })}
              className="h-7 w-7 rounded-full text-lg font-bold flex items-center justify-center transition-all active:scale-90"
              style={{ background: "var(--color-card)" }}
            >
              −
            </button>
            <span className="text-[15px] font-semibold tabular-nums w-10 text-center">
              {hoursSlept > 0 ? `${hoursSlept}h` : "—"}
            </span>
            <button
              onClick={() => onSleepChange({ ...entry.sleep, hours: Math.min(12, hoursSlept + 0.5) })}
              className="h-7 w-7 rounded-full text-lg font-bold flex items-center justify-center transition-all active:scale-90"
              style={{ background: "var(--color-card)" }}
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={() => setNightDone(true)}
          className="w-full rounded-2xl py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98]"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          Fatto · Torna a dormire 🌙
        </button>
      </div>
    );
  }

  // ── MORNING ────────────────────────────────────────────────────────────────
  if (slot === "morning") {
    const qualityLabels = ["", "😩", "😔", "😐", "😊", "😴"];
    const currentQ = entry.sleep.quality;

    return (
      <header className="mb-5 px-1">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="h-3.5 w-3.5" style={{ color: "var(--color-sage-deep)" }} />
          <p className="text-[12px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--color-sage-deep)" }}>
            {formatItalianDate(new Date())}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl" style={{ color: "var(--color-foreground)" }}>
            {firstName ? `Buongiorno, ${firstName}` : "Buongiorno"} 🌱
          </h1>
        </div>
        <p className="text-[14px] mt-1.5 mb-3" style={{ color: "var(--color-muted-foreground)" }}>
          Come hai dormito stanotte?
        </p>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as const).map((q) => (
            <button
              key={q}
              onClick={() => onSleepChange({ ...entry.sleep, quality: q })}
              className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2 transition-all active:scale-95"
              style={{
                background: currentQ === q
                  ? "color-mix(in oklab, var(--color-primary) 14%, var(--color-card))"
                  : "var(--color-muted)",
                border: `1.5px solid ${currentQ === q ? "var(--color-primary)" : "transparent"}`,
              }}
            >
              <span className="text-xl">{qualityLabels[q]}</span>
            </button>
          ))}
        </div>
      </header>
    );
  }

  // ── EVENING ────────────────────────────────────────────────────────────────
  if (slot === "evening") {
    const logged = entry.symptoms.length;
    const hasFlow = entry.flow !== null;
    const hasSleep = entry.sleep.hours !== null || entry.sleep.quality !== null;

    return (
      <header className="mb-5 px-1">
        <div className="flex items-center gap-2 mb-1">
          <Sunset className="h-3.5 w-3.5" style={{ color: "var(--color-sage-deep)" }} />
          <p className="text-[12px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--color-sage-deep)" }}>
            {formatItalianDate(new Date())}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-3xl" style={{ color: "var(--color-foreground)" }}>
            {firstName ? `Com'è andata, ${firstName}?` : "Com'è andata oggi?"}
          </h1>
        </div>
        {(logged > 0 || hasFlow || hasSleep) ? (
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--color-muted-foreground)" }}>
            Hai già registrato{" "}
            {[
              logged > 0 && `${logged} sintom${logged === 1 ? "o" : "i"}`,
              hasSleep && "il sonno",
              hasFlow && "il flusso",
            ]
              .filter(Boolean)
              .join(", ")}
            . Completa se vuoi.
          </p>
        ) : (
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--color-muted-foreground)" }}>
            Prenditi un momento. Registra com'è stata la giornata.
          </p>
        )}
      </header>
    );
  }

  // ── AFTERNOON / default ────────────────────────────────────────────────────
  return (
    <header className="mb-5 px-1">
      <div className="flex items-center gap-2 mb-1">
        <Coffee className="h-3.5 w-3.5" style={{ color: "var(--color-sage-deep)" }} />
        <p className="text-[12px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--color-sage-deep)" }}>
          {formatItalianDate(new Date())}
        </p>
      </div>
      <div className="flex items-center justify-between mt-1">
        <h1 className="text-3xl" style={{ color: "var(--color-foreground)" }}>
          {firstName ? `Come stai, ${firstName}?` : "Ciao. Come va oggi?"}
        </h1>
      </div>
      <p className="text-[14.5px] mt-1.5" style={{ color: "var(--color-muted-foreground)" }}>
        Prenditi un momento. Tu capisci il tuo corpo meglio di chiunque.
      </p>
    </header>
  );
}
