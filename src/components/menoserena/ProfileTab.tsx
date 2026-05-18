import { useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { toast } from "sonner";
import {
  downloadCSV,
  loadProfile,
  saveProfile,
  type MenopauseStage,
  type SymptomKey,
  type UserProfile,
} from "@/lib/storage";
import { SYMPTOMS } from "@/components/menoserena/SymptomGrid";

const STAGE_LABELS: Record<MenopauseStage, string> = {
  perimenopause_early: "Perimenopausa precoce",
  perimenopause_late: "Perimenopausa avanzata",
  menopause: "Menopausa (< 1 anno)",
  postmenopause: "Postmenopausa",
  unknown: "Non sono sicura",
};

const EDUCATION = [
  {
    title: "Cos'è la perimenopausa",
    body: "La perimenopausa è la transizione verso la menopausa, che può durare da 2 a 10 anni. Gli estrogeni fluttuano in modo irregolare, causando sintomi imprevedibili. Non è un'unica fase: è un arco di trasformazione graduale.",
  },
  {
    title: "Vampate e sudorazioni notturne",
    body: "Le vampate sono causate da alterazioni nel termostato ipotalamico dovute alle fluttuazioni estrogeniche. Durano in media 7 anni, in alcune donne oltre 10. Strategie efficaci: abbigliamento a strati, ridurre alcol e caffeina, tecniche respiratorie come il 4-7-8.",
  },
  {
    title: "Nebbia mentale",
    body: "Difficoltà di memoria e concentrazione colpiscono fino al 60% delle donne in perimenopausa. È temporanea e legata agli estrogeni, che proteggono i neuroni. Migliora con sonno regolare, attività fisica e, in alcuni casi, con la TOS.",
  },
  {
    title: "Sonno e perimenopausa",
    body: "Le sudorazioni notturne frammentano il sonno profondo. Meno di 7 ore di sonno aumentano la sensazione di vampate del giorno dopo. Pratiche utili: camera fresca (16-19°C), niente schermi 1h prima, melatonina a basse dosi se necessario.",
  },
  {
    title: "Peso e metabolismo",
    body: "Il calo di estrogeni sposta il grasso verso l'addome anche senza cambiare dieta. Il metabolismo basale si riduce di circa 100-200 kcal/giorno. Forza muscolare e proteine adeguate sono più efficaci della sola restrizione calorica.",
  },
  {
    title: "Quando parlare col medico",
    body: "Parla con il medico se i sintomi interferiscono con la qualità della vita, hai sanguinamenti abbondanti o irregolari, hai palpitazioni frequenti, episodi depressivi significativi, o vuoi valutare la terapia ormonale sostitutiva (TOS).",
  },
];

function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-card)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left gap-3"
      >
        <span className="font-semibold text-[14.5px]">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
            {body}
          </p>
        </div>
      )}
    </div>
  );
}

export function ProfileTab() {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((prev) => {
      const next = { ...prev, [key]: value };
      saveProfile(next);
      return next;
    });
  };

  const toggleConcern = (key: SymptomKey) => {
    const current = profile.topConcerns;
    if (current.includes(key)) {
      update("topConcerns", current.filter((k) => k !== key));
    } else if (current.length < 5) {
      update("topConcerns", [...current, key]);
    }
  };

  const handleExport = () => {
    try {
      downloadCSV();
      toast.success("Export scaricato!");
    } catch {
      toast.error("Errore durante l'export.");
    }
  };

  return (
    <div className="pt-6 flex flex-col gap-6 px-1 pb-4">
      <div>
        <h2 className="text-2xl mb-1">Il tuo profilo</h2>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Tutto salvato solo sul tuo dispositivo.
        </p>
      </div>

      <section className="ms-card flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
            Come ti chiami?
          </label>
          <input
            type="text"
            placeholder="Il tuo nome"
            autoComplete="given-name"
            value={profile.name ?? ""}
            onChange={(e) => update("name", e.target.value || null)}
            className="w-full rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
            style={{
              background: "var(--color-muted)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>

        {/* Stage */}
        <div>
          <p className="text-[13px] font-semibold mb-2" style={{ color: "var(--color-muted-foreground)" }}>
            Fase attuale
          </p>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(STAGE_LABELS) as [MenopauseStage, string][]).map(([key, label]) => {
              const on = profile.stage === key;
              return (
                <button
                  key={key}
                  onClick={() => update("stage", key)}
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] transition-all"
                  style={{
                    background: on
                      ? "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))"
                      : "var(--color-muted)",
                    border: `1.5px solid ${on ? "var(--color-primary)" : "transparent"}`,
                    color: on ? "var(--color-primary)" : "var(--color-foreground)",
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Birth year */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
            Anno di nascita
          </label>
          <input
            type="number"
            min={1940}
            max={2005}
            placeholder="es. 1975"
            value={profile.birthYear ?? ""}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              update("birthYear", isNaN(v) ? null : v);
            }}
            className="w-full rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
            style={{
              background: "var(--color-muted)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>

        {/* Last period */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
            Ultimo ciclo mestruale
          </label>
          <input
            type="date"
            value={profile.lastPeriodDate ?? ""}
            onChange={(e) => update("lastPeriodDate", e.target.value || null)}
            className="w-full rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
            style={{
              background: "var(--color-muted)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>

        {/* Top concerns */}
        <div>
          <p className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--color-muted-foreground)" }}>
            Preoccupazioni principali{" "}
            <span className="font-normal">({profile.topConcerns.length}/5)</span>
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SYMPTOMS.map((s) => {
              const on = profile.topConcerns.includes(s.key);
              const disabled = !on && profile.topConcerns.length >= 5;
              return (
                <button
                  key={s.key}
                  onClick={() => toggleConcern(s.key)}
                  disabled={disabled}
                  className="text-[12px] rounded-full px-2.5 py-1 transition-all"
                  style={{
                    background: on
                      ? "color-mix(in oklab, var(--color-primary) 15%, var(--color-card))"
                      : "var(--color-muted)",
                    border: `1.5px solid ${on ? "var(--color-primary)" : "transparent"}`,
                    color: on ? "var(--color-primary)" : "var(--color-foreground)",
                    opacity: disabled ? 0.35 : 1,
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {s.emoji} {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification time */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
            Promemoria giornaliero
          </label>
          <input
            type="time"
            value={profile.notificationTime ?? ""}
            onChange={(e) => update("notificationTime", e.target.value || null)}
            className="w-full rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
            style={{
              background: "var(--color-muted)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
          <p className="text-[11.5px] mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Vedrai un banner in-app quando non hai ancora registrato.
          </p>
        </div>
      </section>

      {/* CSV Export */}
      <section className="ms-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[14.5px]">Esporta i tuoi dati</h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Scarica tutto il diario in formato CSV.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold text-sm shrink-0 transition-all active:scale-95"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            <Download className="h-4 w-4" />
            Esporta
          </button>
        </div>
      </section>

      {/* Educational content */}
      <section>
        <h3 className="font-semibold text-base mb-3">Capire la perimenopausa</h3>
        <div className="flex flex-col gap-2">
          {EDUCATION.map((item) => (
            <Accordion key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </section>

      <p className="text-[11.5px] text-center px-4 pb-2" style={{ color: "var(--color-muted-foreground)" }}>
        MenoSerena non raccoglie dati personali. Nessun dato viene inviato a server esterni.
      </p>
    </div>
  );
}
