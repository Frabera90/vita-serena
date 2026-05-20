import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Wind } from "lucide-react";

type Phase = "idle" | "inhale" | "hold" | "exhale" | "done";

const PHASES: { phase: Exclude<Phase, "idle" | "done">; label: string; instruction: string; duration: number }[] = [
  { phase: "inhale", label: "Inspira", instruction: "Lentamente, dal naso", duration: 4000 },
  { phase: "hold", label: "Trattieni", instruction: "Trattieni il respiro", duration: 7000 },
  { phase: "exhale", label: "Espira", instruction: "Lentamente, dalla bocca", duration: 8000 },
];

const TOTAL_ROUNDS = 4;

const PHASE_CLASSES: Record<string, string> = {
  inhale: "breathe-in",
  hold: "breathe-hold",
  exhale: "breathe-out",
};

export function BreathingExercise() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countRef.current) clearInterval(countRef.current);
  };

  useEffect(() => () => clearAll(), []);

  const startPhase = (idx: number, currentRound: number) => {
    const p = PHASES[idx];
    setPhase(p.phase);
    setPhaseIdx(idx);
    setSeconds(Math.round(p.duration / 1000));

    if (countRef.current) clearInterval(countRef.current);
    countRef.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);

    timerRef.current = setTimeout(() => {
      clearInterval(countRef.current!);
      const nextIdx = idx + 1;
      if (nextIdx < PHASES.length) {
        startPhase(nextIdx, currentRound);
      } else {
        const nextRound = currentRound + 1;
        if (nextRound <= TOTAL_ROUNDS) {
          setRound(nextRound);
          startPhase(0, nextRound);
        } else {
          setPhase("done");
          setSeconds(0);
        }
      }
    }, p.duration);
  };

  const start = () => {
    setRound(1);
    setPhase("idle");
    setTimeout(() => startPhase(0, 1), 100);
  };

  const stop = () => {
    clearAll();
    setPhase("idle");
    setRound(1);
    setSeconds(0);
  };

  const isRunning = phase !== "idle" && phase !== "done";
  const currentPhase = PHASES[phaseIdx];

  return (
    <section className="ms-card">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
          <div>
            <h2 className="text-xl leading-tight">Respiro 4-7-8</h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Per vampate e ansia · {TOTAL_ROUNDS} round · ~1 minuto
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
        )}
      </button>

      {open && (
        <div className="mt-6 flex flex-col items-center gap-5">
          {/* Circle */}
          <div className="relative flex items-center justify-center">
            <div
              className={`h-32 w-32 rounded-full transition-none ${
                isRunning ? PHASE_CLASSES[phase] ?? "" : ""
              }`}
              style={{
                background: isRunning
                  ? "color-mix(in oklab, var(--color-primary) 30%, var(--color-card))"
                  : "var(--color-muted)",
                boxShadow: isRunning
                  ? "0 0 40px -8px color-mix(in oklab, var(--color-primary) 50%, transparent)"
                  : "none",
                transform: phase === "idle" || phase === "done" ? "scale(0.65)" : undefined,
              }}
            />
            <div className="absolute flex flex-col items-center">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: isRunning ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
              >
                {isRunning ? seconds : phase === "done" ? "✓" : "—"}
              </span>
              {isRunning && (
                <span className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  sec
                </span>
              )}
            </div>
          </div>

          {/* Phase label */}
          <div className="text-center">
            {phase === "idle" && (
              <p className="text-[14px]" style={{ color: "var(--color-muted-foreground)" }}>
                Tecnica clinicamente validata per ridurre ansia e vampate.
              </p>
            )}
            {isRunning && (
              <>
                <p className="text-xl font-semibold">{currentPhase.label}</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                  {currentPhase.instruction}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                  Round {round} di {TOTAL_ROUNDS}
                </p>
              </>
            )}
            {phase === "done" && (
              <p className="text-[15px] font-semibold" style={{ color: "var(--color-primary)" }}>
                Ottimo lavoro. Come ti senti? 🌿
              </p>
            )}
          </div>

          {/* Button */}
          {!isRunning ? (
            <button
              onClick={start}
              className="rounded-2xl px-8 py-3 font-semibold transition-all active:scale-95"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              {phase === "done" ? "Ricomincia" : "Inizia"}
            </button>
          ) : (
            <button
              onClick={stop}
              className="rounded-2xl px-8 py-3 font-semibold transition-all active:scale-95"
              style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
            >
              Ferma
            </button>
          )}

          {/* Steps guide */}
          {phase === "idle" && (
            <div className="flex w-full justify-between text-[12px]" style={{ color: "var(--color-muted-foreground)" }}>
              {PHASES.map((p) => (
                <div key={p.phase} className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold">{p.label}</span>
                  <span>{p.duration / 1000}s</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
