import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { loadEntriesForRange } from "@/lib/storage";
import { SYMPTOMS } from "@/components/menoserena/SymptomGrid";

const RANGES = [
  { label: "30 gg", days: 30 },
  { label: "90 gg", days: 90 },
  { label: "365 gg", days: 365 },
];

const FLOW_LABELS: Record<string, string> = {
  dry: "Nessun flusso",
  spotting: "Spotting",
  heavy: "Abbondante",
};

const QUALITY_LABEL = ["", "Pessimo", "Scarso", "Discreto", "Buono", "Ottimo"];

const SHORT: Record<string, string> = {
  vampata: "Vampata",
  sudorazione_notturna: "Sudor. nott.",
  ansia: "Ansia",
  sbalzi_umore: "Sbalzi",
  irritabilita: "Irritab.",
  umore_depresso: "Depresso",
  pianto_facile: "Pianto",
  attacco_panico: "Panico",
  nebbia: "Nebbia",
  stanchezza: "Stanchezza",
  mal_di_testa: "Testa",
  capogiri: "Capogiri",
  palpitazioni: "Palpitaz.",
  formicolio: "Formicol.",
  prurito: "Prurito",
  secchezza_pelle: "Pelle secca",
  perdita_capelli: "Capelli",
  acne: "Acne",
  gonfiore: "Gonfiore",
  nausea: "Nausea",
  costipazione: "Costip.",
  fame: "Voglie",
  secchezza_vaginale: "Secch. vag.",
  dolore_rapporti: "Dolore rapp.",
  bassa_libido: "Libido",
  incontinenza: "Incontinen.",
  scosse_elettriche: "Scosse",
  acufeni: "Acufeni",
  bruciore_bocca: "Bocca",
  occhi_secchi: "Occhi secchi",
};

export function History() {
  const [range, setRange] = useState(30);
  const entries = useMemo(() => loadEntriesForRange(range), [range]);

  const symptomData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      for (const s of e.symptoms) counts[s] = (counts[s] || 0) + 1;
    }
    return SYMPTOMS.map((s) => ({ name: SHORT[s.key] ?? s.key, count: counts[s.key] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [entries]);

  const sleepData = useMemo(
    () =>
      [...entries]
        .reverse()
        .filter((e) => e.sleep.hours !== null || e.sleep.quality !== null)
        .slice(-30)
        .map((e) => ({
          date: e.date.slice(5),
          ore: e.sleep.hours,
          qualita: e.sleep.quality,
        })),
    [entries]
  );

  const weightData = useMemo(
    () =>
      [...entries]
        .reverse()
        .filter((e) => e.weight !== null)
        .slice(-30)
        .map((e) => ({ date: e.date.slice(5), peso: e.weight })),
    [entries]
  );

  const flowCounts = useMemo(() => {
    const c = { dry: 0, spotting: 0, heavy: 0 };
    for (const e of entries) if (e.flow) c[e.flow]++;
    return c;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="pt-8 px-1">
        <h2 className="text-2xl mb-2">Cronologia</h2>
        <p className="text-[14.5px]" style={{ color: "var(--color-muted-foreground)" }}>
          Non ci sono ancora dati salvati negli ultimi {range} giorni.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-6 flex flex-col gap-5 px-1">
      <div>
        <h2 className="text-2xl mb-1">Cronologia</h2>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          {entries.length} giornate registrate
        </p>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setRange(r.days)}
            className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95"
            style={{
              background: range === r.days ? "var(--color-primary)" : "var(--color-muted)",
              color: range === r.days ? "white" : "var(--color-muted-foreground)",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Symptom frequency */}
      {symptomData.length > 0 && (
        <section className="ms-card">
          <h3 className="font-semibold text-base mb-4">Sintomi più frequenti</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={symptomData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={48}
              />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${v} volte`, "Occorrenze"]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,.1)" }}
              />
              <Bar dataKey="count" fill="var(--color-accent)" radius={[5, 5, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Sleep chart */}
      {sleepData.length > 1 && (
        <section className="ms-card">
          <h3 className="font-semibold text-base mb-4">Andamento del sonno</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sleepData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 12]} />
              <Tooltip
                formatter={(v, name) => [
                  name === "ore" ? `${v}h` : `${v}/5`,
                  name === "ore" ? "Ore dormite" : "Qualità",
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,.1)" }}
              />
              <Line type="monotone" dataKey="ore" stroke="var(--color-primary)" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="qualita" stroke="var(--color-accent)" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm inline-block" style={{ background: "var(--color-primary)" }} /> Ore
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm inline-block" style={{ background: "var(--color-accent)" }} /> Qualità (/5)
            </span>
          </div>
        </section>
      )}

      {/* Weight chart */}
      {weightData.length > 1 && (
        <section className="ms-card">
          <h3 className="font-semibold text-base mb-4">Andamento del peso</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weightData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} unit=" kg" />
              <Tooltip
                formatter={(v) => [`${v} kg`, "Peso"]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,.1)" }}
              />
              <Line type="monotone" dataKey="peso" stroke="var(--color-primary)" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Flow */}
      {(flowCounts.dry + flowCounts.spotting + flowCounts.heavy) > 0 && (
        <section className="ms-card">
          <h3 className="font-semibold text-base mb-3">Pattern del flusso</h3>
          <div className="flex gap-3">
            {(["dry", "spotting", "heavy"] as const).map((k) => {
              if (!flowCounts[k]) return null;
              return (
                <div key={k} className="flex-1 rounded-xl p-3 text-center" style={{ background: "var(--color-muted)" }}>
                  <div className="text-xl font-bold">{flowCounts[k]}</div>
                  <div className="text-[12px] mt-0.5 leading-tight" style={{ color: "var(--color-muted-foreground)" }}>
                    {FLOW_LABELS[k]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Entry list */}
      <section>
        <h3 className="font-semibold text-base mb-3">Ultime registrazioni</h3>
        <div className="flex flex-col gap-2">
          {entries.slice(0, 30).map((entry) => (
            <div key={entry.date} className="ms-card py-3 px-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm capitalize">
                  {new Date(entry.date + "T12:00:00").toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  {entry.sleep.hours !== null && (
                    <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))", color: "var(--color-primary)" }}>
                      🌙 {entry.sleep.hours}h
                    </span>
                  )}
                  {entry.weight !== null && (
                    <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>
                      ⚖️ {entry.weight}kg
                    </span>
                  )}
                  {entry.flow && (
                    <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: "var(--color-terracotta-soft)", color: "var(--color-accent)" }}>
                      {FLOW_LABELS[entry.flow]}
                    </span>
                  )}
                </div>
              </div>
              {entry.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.symptoms.slice(0, 6).map((s) => {
                    const sym = SYMPTOMS.find((x) => x.key === s);
                    return (
                      <span key={s} className="text-[11px] rounded-full px-2 py-0.5"
                        style={{ background: "color-mix(in oklab, var(--color-accent) 12%, var(--color-card))", color: "var(--color-accent)" }}>
                        {sym?.emoji} {SHORT[s] ?? s}
                      </span>
                    );
                  })}
                  {entry.symptoms.length > 6 && (
                    <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>
                      +{entry.symptoms.length - 6}
                    </span>
                  )}
                </div>
              )}
              {entry.sleep.quality !== null && (
                <p className="text-[11.5px] mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                  Sonno {QUALITY_LABEL[entry.sleep.quality].toLowerCase()}
                  {entry.sleep.disturbances.length > 0 ? ` · ${entry.sleep.disturbances.length} disturbo/i` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
