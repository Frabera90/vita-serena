import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  defaultProfile,
  saveProfile,
  type MenopauseStage,
  type SymptomKey,
  type UserProfile,
} from "@/lib/storage";
import { SYMPTOMS } from "@/components/menoserena/SymptomGrid";

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const STAGES: { key: MenopauseStage; label: string; sub: string; emoji: string }[] = [
  {
    key: "perimenopause_early",
    emoji: "🌱",
    label: "Perimenopausa precoce",
    sub: "Il ciclo è ancora presente ma sta cambiando. Primi sintomi.",
  },
  {
    key: "perimenopause_late",
    emoji: "🌿",
    label: "Perimenopausa avanzata",
    sub: "Cicli molto irregolari, spesso saltati. Sintomi più intensi.",
  },
  {
    key: "menopause",
    emoji: "🌸",
    label: "Menopausa recente",
    sub: "L'ultimo ciclo è stato circa un anno fa o meno.",
  },
  {
    key: "postmenopause",
    emoji: "🌼",
    label: "Post-menopausa",
    sub: "Oltre un anno senza ciclo.",
  },
  {
    key: "unknown",
    emoji: "❓",
    label: "Non lo so ancora",
    sub: "Va benissimo così — l'app ti aiuterà a capirlo.",
  },
];

const TOP_CONCERNS_KEYS: SymptomKey[] = [
  "vampata", "sudorazione_notturna", "stanchezza", "nebbia", "ansia",
  "sbalzi_umore", "mal_di_testa", "gonfiore", "perdita_capelli",
  "secchezza_vaginale", "bassa_libido", "incontinenza",
];

const TOTAL_STEPS = 5;

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    const profile: UserProfile = {
      ...defaultProfile(),
      ...draft,
      onboardingComplete: true,
    };
    saveProfile(profile);
    onComplete(profile);
  };

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      {/* Progress */}
      <div className="flex items-center gap-2 px-6 pt-safe pt-6">
        {step > 0 && (
          <button onClick={prev} className="mr-1 p-1 rounded-full" aria-label="Indietro">
            <ChevronLeft className="h-5 w-5" style={{ color: "var(--color-muted-foreground)" }} />
          </button>
        )}
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i <= step ? "var(--color-primary)" : "var(--color-muted)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-lg mx-auto w-full">
        {step === 0 && <StepWelcome />}
        {step === 1 && (
          <StepStage
            value={draft.stage ?? null}
            onChange={(s) => setDraft((d) => ({ ...d, stage: s }))}
          />
        )}
        {step === 2 && (
          <StepConcerns
            value={draft.topConcerns ?? []}
            onChange={(v) => setDraft((d) => ({ ...d, topConcerns: v }))}
          />
        )}
        {step === 3 && (
          <StepLastPeriod
            lastPeriodDate={draft.lastPeriodDate ?? null}
            birthYear={draft.birthYear ?? null}
            onChangePeriod={(v) => setDraft((d) => ({ ...d, lastPeriodDate: v }))}
            onChangeBirth={(v) => setDraft((d) => ({ ...d, birthYear: v }))}
          />
        )}
        {step === 4 && (
          <StepNotification
            value={draft.notificationTime ?? null}
            onChange={(v) => setDraft((d) => ({ ...d, notificationTime: v }))}
          />
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pb-safe max-w-lg mx-auto w-full">
        <button
          onClick={isLast ? finish : next}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold transition-all active:scale-[0.98]"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          {isLast ? "Inizia il diario →" : "Avanti"}
          {!isLast && <ChevronRight className="h-5 w-5" />}
        </button>
        {step === 0 && (
          <button
            onClick={finish}
            className="mt-3 w-full text-sm text-center underline underline-offset-2"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Salta e inizia subito
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="flex flex-col items-center text-center gap-5 pt-6">
      <div className="text-6xl">🌸</div>
      <div>
        <h1 className="text-3xl mb-3">Benvenuta in MenoSerena</h1>
        <p className="text-[15.5px] leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          Il primo diario della perimenopausa in italiano. Gentile, privato, sempre gratuito.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full mt-4">
        {[
          { emoji: "🔒", text: "I dati restano solo sul tuo telefono" },
          { emoji: "🇮🇹", text: "Pensato per le donne italiane" },
          { emoji: "🩺", text: "Report per il ginecologo incluso" },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{ background: "var(--color-muted)" }}
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[14px] font-medium">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepStage({
  value,
  onChange,
}: {
  value: MenopauseStage | null;
  onChange: (s: MenopauseStage) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl mb-2">Dove ti trovi?</h2>
      <p className="text-[14.5px] mb-6" style={{ color: "var(--color-muted-foreground)" }}>
        Puoi cambiarlo in qualsiasi momento dal tuo profilo.
      </p>
      <div className="flex flex-col gap-2.5">
        {STAGES.map((s) => {
          const isOn = value === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              className="flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98]"
              style={{
                borderColor: isOn ? "var(--color-primary)" : "var(--color-border)",
                background: isOn
                  ? "color-mix(in oklab, var(--color-primary) 8%, var(--color-card))"
                  : "var(--color-card)",
              }}
            >
              <span className="text-2xl leading-none mt-0.5">{s.emoji}</span>
              <div>
                <div className="font-semibold text-[14.5px]">{s.label}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  {s.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepConcerns({
  value,
  onChange,
}: {
  value: SymptomKey[];
  onChange: (v: SymptomKey[]) => void;
}) {
  const toggle = (k: SymptomKey) => {
    if (value.includes(k)) {
      onChange(value.filter((x) => x !== k));
    } else if (value.length < 5) {
      onChange([...value, k]);
    }
  };
  const concerns = SYMPTOMS.filter((s) => TOP_CONCERNS_KEYS.includes(s.key));

  return (
    <div>
      <h2 className="text-2xl mb-2">Cosa ti preoccupa di più?</h2>
      <p className="text-[14.5px] mb-1" style={{ color: "var(--color-muted-foreground)" }}>
        Scegli fino a 5 sintomi.
      </p>
      <p className="text-sm font-semibold mb-5" style={{ color: "var(--color-primary)" }}>
        {value.length}/5 selezionati
      </p>
      <div className="grid grid-cols-2 gap-2">
        {concerns.map((s) => {
          const isOn = value.includes(s.key);
          const disabled = !isOn && value.length >= 5;
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              disabled={disabled}
              className="flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.97] disabled:opacity-40"
              style={{
                borderColor: isOn ? "var(--color-accent)" : "var(--color-border)",
                background: isOn
                  ? "color-mix(in oklab, var(--color-accent) 10%, var(--color-card))"
                  : "var(--color-card)",
              }}
            >
              <span className="text-xl leading-none">{s.emoji}</span>
              <div className="font-semibold text-[13px] leading-tight">{s.label.split(" / ")[0]}</div>
            </button>
          );
        })}
      </div>
      <p className="text-[12.5px] mt-4 text-center" style={{ color: "var(--color-muted-foreground)" }}>
        Puoi anche saltare questo step — tutti i sintomi saranno tracciabili.
      </p>
    </div>
  );
}

function StepLastPeriod({
  lastPeriodDate,
  birthYear,
  onChangePeriod,
  onChangeBirth,
}: {
  lastPeriodDate: string | null;
  birthYear: number | null;
  onChangePeriod: (v: string | null) => void;
  onChangeBirth: (v: number | null) => void;
}) {
  const [noMemory, setNoMemory] = useState(lastPeriodDate === "unknown");

  return (
    <div>
      <h2 className="text-2xl mb-2">Qualche dato in più</h2>
      <p className="text-[14.5px] mb-6" style={{ color: "var(--color-muted-foreground)" }}>
        Opzionale — ci aiuta a personalizzare i tuoi Insights.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Anno di nascita</label>
          <input
            type="number"
            min={1940}
            max={2000}
            placeholder="Es. 1972"
            value={birthYear ?? ""}
            onChange={(e) =>
              onChangeBirth(e.target.value ? parseInt(e.target.value) : null)
            }
            className="w-full rounded-xl border px-4 py-3 text-base outline-none"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Ultimo ciclo mestruale</label>
          <div className="flex flex-col gap-2">
            <input
              type="month"
              disabled={noMemory}
              value={(!noMemory && lastPeriodDate) ? lastPeriodDate.slice(0, 7) : ""}
              onChange={(e) =>
                onChangePeriod(e.target.value ? e.target.value + "-01" : null)
              }
              className="w-full rounded-xl border px-4 py-3 text-base outline-none disabled:opacity-40"
              style={{
                background: "var(--color-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={noMemory}
                onChange={(e) => {
                  setNoMemory(e.target.checked);
                  onChangePeriod(e.target.checked ? "unknown" : null);
                }}
                className="rounded"
              />
              <span style={{ color: "var(--color-muted-foreground)" }}>
                Non ricordo / non ho più cicli
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepNotification({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const enabled = value !== null;

  return (
    <div>
      <h2 className="text-2xl mb-2">Promemoria serale</h2>
      <p className="text-[14.5px] mb-6" style={{ color: "var(--color-muted-foreground)" }}>
        Ti ricordiamo di registrare quando apri l'app dopo quest'ora. Nessuna notifica push — tutto dentro l'app.
      </p>

      <div className="ms-card mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-[15px]">Attiva promemoria</span>
          <button
            onClick={() => onChange(enabled ? null : "21:00")}
            className="relative h-7 w-12 rounded-full transition-colors duration-200"
            style={{
              background: enabled ? "var(--color-primary)" : "var(--color-muted)",
            }}
          >
            <span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: enabled ? "1.375rem" : "0.125rem" }}
            />
          </button>
        </div>

        {enabled && (
          <div>
            <label className="block text-sm font-medium mb-2">A che ora?</label>
            <input
              type="time"
              value={value ?? "21:00"}
              onChange={(e) => onChange(e.target.value || "21:00")}
              className="w-full rounded-xl border px-4 py-3 text-base outline-none"
              style={{
                background: "var(--color-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            />
          </div>
        )}
      </div>

      <p className="text-[12.5px] text-center" style={{ color: "var(--color-muted-foreground)" }}>
        🔒 Nessun dato esce dal tuo dispositivo. Il promemoria è solo visivo, non una notifica push.
      </p>
    </div>
  );
}
