import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const SHORT: Record<string, string> = {
  vampata: "Vampata",
  ansia: "Ansia",
  nebbia: "Nebbia",
  prurito: "Prurito",
  palpitazioni: "Palpitaz.",
  fame: "Fame",
};

export function History() {
  const [range, setRange] = useState(30);
  const entries = useMemo(() => loadEntriesForRange(range), [range]);

  const symptomData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      for (const s of e.symptoms) counts[s] = (counts[s] || 0) + 1;
    }
    return SYMPTOMS.map((s) => ({ name: SHORT[s.key], count: counts[s.key] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [entries]);

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
          Non ci sono ancora dati salvati negli ultimi {range} giorni. Inizia tracciando oggi.
        </p>
      </div>
    );
  }

  const totalFlow = flowCounts.dry + flowCounts.spotting + flowCounts.heavy;

  return (
    <div className="pt-6 flex flex-col gap-5 px-1">
      <div>
        <h2 className="text-2xl mb-1">Cronologia</h2>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          {entries.length} giornate registrate
        </p>
      </div>

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

      {symptomData.length > 0 && (
        <section className="ms-card">
          <h3 className="font-semibold text-base mb-4">Sintomi più frequenti</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={symptomData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${v} volte`, "Occorrenze"]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,.1)" }}
                cursor={{ fill: "color-mix(in oklab, var(--color-accent) 8%, transparent)" }}
              />
              <Bar dataKey="count" fill="var(--color-accent)" radius={[5, 5, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {totalFlow > 0 && (
        <section className="ms-card">
          <h3 className="font-semibold text-base mb-3">Pattern del flusso</h3>
          <div className="flex gap-3">
            {(["dry", "spotting", "heavy"] as const).map((k) => {
              if (!flowCounts[k]) return null;
              return (
                <div
                  key={k}
                  className="flex-1 rounded-xl p-3 text-center"
                  style={{ background: "var(--color-muted)" }}
                >
                  <div className="text-xl font-bold">{flowCounts[k]}</div>
                  <div
                    className="text-[12px] mt-0.5 leading-tight"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {FLOW_LABELS[k]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
                {entry.flow && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: "var(--color-terracotta-soft)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {FLOW_LABELS[entry.flow]}
                  </span>
                )}
              </div>
              {entry.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.symptoms.map((s) => {
                    const sym = SYMPTOMS.find((x) => x.key === s);
                    return (
                      <span
                        key={s}
                        className="text-[12px] rounded-full px-2 py-0.5"
                        style={{
                          background: "color-mix(in oklab, var(--color-accent) 12%, var(--color-card))",
                          color: "var(--color-accent)",
                        }}
                      >
                        {sym?.emoji} {SHORT[s]}
                      </span>
                    );
                  })}
                </div>
              )}
              {entry.notes.length > 0 && (
                <p
                  className="text-[12px] mt-1"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {entry.notes.length} nota{entry.notes.length > 1 ? "e" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
