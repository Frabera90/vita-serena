import { useMemo } from "react";
import { Calendar, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { loadAllEntries } from "@/lib/storage";
import { SYMPTOMS } from "@/components/menoserena/SymptomGrid";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

export function Insights() {
  const entries = useMemo(() => loadAllEntries(), []);

  const stats = useMemo(() => {
    if (entries.length < 3) return null;

    const symptomCounts: Record<string, number> = {};
    for (const e of entries) {
      for (const s of e.symptoms) symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    }
    const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

    const dayBuckets: Record<number, { total: number; count: number }> = {};
    for (const e of entries) {
      const day = new Date(e.date + "T12:00:00").getDay();
      if (!dayBuckets[day]) dayBuckets[day] = { total: 0, count: 0 };
      dayBuckets[day].total += e.symptoms.length;
      dayBuckets[day].count++;
    }
    const dayAvgs = Object.entries(dayBuckets).map(([d, v]) => ({
      day: Number(d),
      avg: v.total / v.count,
    }));
    const hardestDay = [...dayAvgs].sort((a, b) => b.avg - a.avg)[0]?.day ?? null;
    const easiestDay = [...dayAvgs].sort((a, b) => a.avg - b.avg)[0]?.day ?? null;

    const withFlow = entries.filter((e) => e.flow !== null && e.flow !== "dry");
    const dry = entries.filter((e) => e.flow === "dry");
    const avgFlow =
      withFlow.length > 0
        ? withFlow.reduce((s, e) => s + e.symptoms.length, 0) / withFlow.length
        : null;
    const avgDry =
      dry.length > 0
        ? dry.reduce((s, e) => s + e.symptoms.length, 0) / dry.length
        : null;

    const now = Date.now();
    const last7 = entries.filter((e) => now - new Date(e.date + "T12:00:00").getTime() < 7 * 86400000);
    const prev7 = entries.filter((e) => {
      const diff = now - new Date(e.date + "T12:00:00").getTime();
      return diff >= 7 * 86400000 && diff < 14 * 86400000;
    });
    const last7Avg = last7.length > 0 ? last7.reduce((s, e) => s + e.symptoms.length, 0) / last7.length : null;
    const prev7Avg = prev7.length > 0 ? prev7.reduce((s, e) => s + e.symptoms.length, 0) / prev7.length : null;

    return { topSymptom, hardestDay, easiestDay, avgFlow, avgDry, last7Avg, prev7Avg, total: entries.length };
  }, [entries]);

  if (!stats) {
    return (
      <div className="pt-8 px-1">
        <h2 className="text-2xl mb-2">Insights</h2>
        <p className="text-[14.5px]" style={{ color: "var(--color-muted-foreground)" }}>
          Registra almeno 3 giornate per vedere i tuoi pattern. Tutto viene analizzato solo sul tuo dispositivo.
        </p>
      </div>
    );
  }

  const topSym = stats.topSymptom ? SYMPTOMS.find((s) => s.key === stats.topSymptom![0]) : null;
  const trendImproving = stats.last7Avg !== null && stats.prev7Avg !== null && stats.last7Avg < stats.prev7Avg - 0.2;
  const trendWorsening = stats.last7Avg !== null && stats.prev7Avg !== null && stats.last7Avg > stats.prev7Avg + 0.2;

  return (
    <div className="pt-6 flex flex-col gap-4 px-1">
      <div>
        <h2 className="text-2xl mb-1">Insights</h2>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Elaborati sul tuo dispositivo su {stats.total} registrazioni
        </p>
      </div>

      {(trendImproving || trendWorsening) && (
        <div className="ms-card flex items-start gap-3">
          {trendImproving ? (
            <TrendingDown className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
          ) : (
            <TrendingUp className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-accent)" }} />
          )}
          <div>
            <div className="font-semibold text-[14.5px]">
              {trendImproving ? "Settimana più leggera" : "Settimana più intensa"}
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {trendImproving
                ? "Negli ultimi 7 giorni hai avuto meno sintomi rispetto alla settimana precedente."
                : "Negli ultimi 7 giorni hai avuto più sintomi rispetto alla settimana precedente."}
            </p>
          </div>
        </div>
      )}

      {topSym && stats.topSymptom && (
        <div className="ms-card flex items-start gap-3">
          <span className="text-2xl leading-none">{topSym.emoji}</span>
          <div>
            <div className="font-semibold text-[14.5px]">Sintomo più presente</div>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              <strong>{topSym.label}</strong> è comparso in {stats.topSymptom[1]} giornate registrate.
            </p>
          </div>
        </div>
      )}

      {stats.hardestDay !== null &&
        stats.easiestDay !== null &&
        stats.hardestDay !== stats.easiestDay && (
          <div className="ms-card flex items-start gap-3">
            <Calendar
              className="h-5 w-5 mt-0.5 shrink-0"
              style={{ color: "var(--color-accent)" }}
            />
            <div>
              <div className="font-semibold text-[14.5px]">Pattern settimanale</div>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                <strong>{DAY_NAMES[stats.hardestDay]}</strong> è tendenzialmente il giorno più
                difficile, mentre <strong>{DAY_NAMES[stats.easiestDay]}</strong> è il più sereno.
              </p>
            </div>
          </div>
        )}

      {stats.avgFlow !== null && stats.avgDry !== null && (
        <div className="ms-card flex items-start gap-3">
          <Lightbulb
            className="h-5 w-5 mt-0.5 shrink-0"
            style={{ color: "var(--color-accent)" }}
          />
          <div>
            <div className="font-semibold text-[14.5px]">Flusso e sintomi</div>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {stats.avgFlow > stats.avgDry
                ? `Nei giorni con flusso hai in media ${(stats.avgFlow - stats.avgDry).toFixed(1)} sintomi in più rispetto ai giorni senza.`
                : `Nei giorni senza flusso hai in media più sintomi — i sintomi della perimenopausa non seguono sempre il ciclo.`}
            </p>
          </div>
        </div>
      )}

      <p
        className="text-[12px] text-center px-4 pt-1"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        Tutti i calcoli avvengono sul tuo dispositivo. Nessun dato viene inviato a server esterni.
      </p>
    </div>
  );
}
