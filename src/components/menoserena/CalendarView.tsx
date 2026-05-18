import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { loadAllEntries, type DayEntry } from "@/lib/storage";
import { SYMPTOMS } from "@/components/menoserena/SymptomGrid";

const MONTHS_IT = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre",
];
const DAYS_IT = ["Lu","Ma","Me","Gi","Ve","Sa","Do"];

const FLOW_LABELS: Record<string, string> = {
  dry: "Nessun flusso",
  spotting: "Spotting",
  heavy: "Abbondante",
};

const SHORT: Record<string, string> = {
  vampata: "Vampata", sudorazione_notturna: "Sudd. nott.", ansia: "Ansia",
  sbalzi_umore: "Sbalzi", irritabilita: "Irritab.", umore_depresso: "Depresso",
  pianto_facile: "Pianto", attacco_panico: "Panico", nebbia: "Nebbia",
  stanchezza: "Stanchezza", mal_di_testa: "Testa", capogiri: "Capogiri",
  palpitazioni: "Palpitaz.", formicolio: "Formicol.", prurito: "Prurito",
  secchezza_pelle: "Pelle secca", perdita_capelli: "Capelli", acne: "Acne",
  gonfiore: "Gonfiore", nausea: "Nausea", costipazione: "Costip.",
  fame: "Voglie", secchezza_vaginale: "Secch. vag.", dolore_rapporti: "Dolore rapp.",
  bassa_libido: "Libido", incontinenza: "Incont.", scosse_elettriche: "Scosse",
  acufeni: "Acufeni", bruciore_bocca: "Bocca", occhi_secchi: "Occhi",
};

const QUALITY_LABEL = ["","Pessimo","Scarso","Discreto","Buono","Ottimo"];

const cellBg = (entry: DayEntry | undefined): string => {
  if (!entry) return "transparent";
  const n = entry.symptoms.length;
  if (n === 0 && !entry.flow) return "color-mix(in oklab, var(--color-primary) 8%, transparent)";
  if (n <= 2) return "color-mix(in oklab, var(--color-primary) 18%, transparent)";
  if (n <= 5) return "color-mix(in oklab, var(--color-accent) 22%, transparent)";
  return "color-mix(in oklab, var(--color-accent) 42%, transparent)";
};

const hasFlow = (e: DayEntry | undefined) =>
  e?.flow === "spotting" || e?.flow === "heavy";

export function CalendarView() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allEntries = useMemo(() => loadAllEntries(), []);
  const entryMap = useMemo(() => {
    const m = new Map<string, DayEntry>();
    for (const e of allEntries) m.set(e.date, e);
    return m;
  }, [allEntries]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstOffset + daysInMonth }, (_, i) =>
    i < firstOffset ? null : i - firstOffset + 1
  );

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const dateKey = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const selectedEntry = selectedDate ? entryMap.get(selectedDate) : null;

  const recentEntries = useMemo(
    () => allEntries.slice().reverse().slice(0, 20),
    [allEntries]
  );

  return (
    <div className="pt-6 flex flex-col gap-5 px-1">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{MONTHS_IT[month]} {year}</h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="rounded-full p-2 transition-all active:scale-90"
            style={{ background: "var(--color-muted)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-full p-2 transition-all active:scale-90"
            style={{ background: "var(--color-muted)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[11px] flex-wrap" style={{ color: "var(--color-muted-foreground)" }}>
        {[
          { color: "color-mix(in oklab, var(--color-primary) 18%, transparent)", label: "1-2 sintomi" },
          { color: "color-mix(in oklab, var(--color-accent) 22%, transparent)", label: "3-5 sintomi" },
          { color: "color-mix(in oklab, var(--color-accent) 42%, transparent)", label: "6+ sintomi" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm inline-block border" style={{ background: l.color, borderColor: "var(--color-border)" }} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: "oklch(0.62 0.18 15)" }} />
          Flusso
        </span>
      </div>

      {/* Calendar grid */}
      <div className="ms-card p-3">
        <div className="grid grid-cols-7 mb-1">
          {DAYS_IT.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold py-1" style={{ color: "var(--color-muted-foreground)" }}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const key = dateKey(day);
            const entry = entryMap.get(key);
            const isToday = key === todayStr;
            const isSelected = key === selectedDate;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className="relative flex flex-col items-center justify-center rounded-lg transition-all active:scale-95"
                style={{
                  aspectRatio: "1",
                  background: isSelected
                    ? "var(--color-primary)"
                    : cellBg(entry),
                  border: isToday && !isSelected
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                }}
              >
                <span
                  className="text-[12.5px] font-semibold"
                  style={{
                    color: isSelected ? "white" : "var(--color-foreground)",
                  }}
                >
                  {day}
                </span>
                {hasFlow(entry) && !isSelected && (
                  <span
                    className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: "oklch(0.62 0.18 15)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      {selectedDate && selectedEntry && (
        <section className="ms-card">
          <h3 className="font-semibold text-base mb-3 capitalize">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("it-IT", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </h3>
          <div className="flex flex-col gap-2">
            {selectedEntry.flow && (
              <div className="flex gap-2 text-sm">
                <span className="font-medium w-20 shrink-0" style={{ color: "var(--color-muted-foreground)" }}>Flusso</span>
                <span>{FLOW_LABELS[selectedEntry.flow]}</span>
              </div>
            )}
            {selectedEntry.sleep.hours !== null && (
              <div className="flex gap-2 text-sm">
                <span className="font-medium w-20 shrink-0" style={{ color: "var(--color-muted-foreground)" }}>Sonno</span>
                <span>{selectedEntry.sleep.hours}h{selectedEntry.sleep.quality ? ` · ${QUALITY_LABEL[selectedEntry.sleep.quality]}` : ""}</span>
              </div>
            )}
            {selectedEntry.weight !== null && (
              <div className="flex gap-2 text-sm">
                <span className="font-medium w-20 shrink-0" style={{ color: "var(--color-muted-foreground)" }}>Peso</span>
                <span>{selectedEntry.weight} kg</span>
              </div>
            )}
            {selectedEntry.symptoms.length > 0 && (
              <div className="flex gap-2 text-sm">
                <span className="font-medium w-20 shrink-0 mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>Sintomi</span>
                <div className="flex flex-wrap gap-1">
                  {selectedEntry.symptoms.map((s) => {
                    const sym = SYMPTOMS.find((x) => x.key === s);
                    return (
                      <span key={s} className="text-[11px] rounded-full px-2 py-0.5"
                        style={{ background: "color-mix(in oklab, var(--color-accent) 12%, var(--color-card))", color: "var(--color-accent)" }}>
                        {sym?.emoji} {SHORT[s] ?? s}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedEntry.notes.length > 0 && (
              <div className="flex gap-2 text-sm">
                <span className="font-medium w-20 shrink-0" style={{ color: "var(--color-muted-foreground)" }}>Note</span>
                <span>{selectedEntry.notes.length} nota{selectedEntry.notes.length > 1 ? "e" : ""}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {selectedDate && !selectedEntry && (
        <section className="ms-card py-3">
          <p className="text-sm text-center" style={{ color: "var(--color-muted-foreground)" }}>
            Nessun dato registrato per questo giorno.
          </p>
        </section>
      )}

      {/* Recent entries */}
      <section>
        <h3 className="font-semibold text-base mb-3">Ultime registrazioni</h3>
        {recentEntries.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Nessun dato ancora. Inizia tracciando oggi.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentEntries.map((entry) => (
              <button
                key={entry.date}
                onClick={() => {
                  const d = new Date(entry.date + "T12:00:00");
                  setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
                  setSelectedDate(entry.date);
                }}
                className="ms-card py-3 px-4 text-left"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm capitalize">
                    {new Date(entry.date + "T12:00:00").toLocaleDateString("it-IT", {
                      weekday: "short", day: "numeric", month: "short",
                    })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {entry.sleep.hours !== null && (
                      <span className="text-[11px] rounded-full px-2 py-0.5"
                        style={{ background: "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))", color: "var(--color-primary)" }}>
                        🌙 {entry.sleep.hours}h
                      </span>
                    )}
                    {entry.flow && (
                      <span className="text-[11px] rounded-full px-2 py-0.5"
                        style={{ background: "var(--color-terracotta-soft)", color: "var(--color-accent)" }}>
                        {FLOW_LABELS[entry.flow]}
                      </span>
                    )}
                  </div>
                </div>
                {entry.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.symptoms.slice(0, 5).map((s) => {
                      const sym = SYMPTOMS.find((x) => x.key === s);
                      return (
                        <span key={s} className="text-[11px] rounded-full px-2 py-0.5"
                          style={{ background: "color-mix(in oklab, var(--color-accent) 12%, var(--color-card))", color: "var(--color-accent)" }}>
                          {sym?.emoji} {SHORT[s] ?? s}
                        </span>
                      );
                    })}
                    {entry.symptoms.length > 5 && (
                      <span className="text-[11px] rounded-full px-2 py-0.5"
                        style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>
                        +{entry.symptoms.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
