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
import { Calendar, Lightbulb, Moon, TrendingDown, TrendingUp } from "lucide-react";
import { loadAllEntries, loadEntriesForRange } from "@/lib/storage";
import { SYMPTOMS } from "@/components/menoserena/SymptomGrid";

const RANGES = [
  { label: "30 gg", days: 30 },
  { label: "90 gg", days: 90 },
  { label: "365 gg", days: 365 },
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

const SHORT: Record<string, string> = {
  vampata: "Vampata", sudorazione_notturna: "Sudor. nott.", ansia: "Ansia",
  sbalzi_umore: "Sbalzi", irritabilita: "Irritab.", umore_depresso: "Depresso",
  pianto_facile: "Pianto", attacco_panico: "Panico", nebbia: "Nebbia",
  stanchezza: "Stanchezza", mal_di_testa: "Testa", capogiri: "Capogiri",
  palpitazioni: "Palpitaz.", formicolio: "Formicol.", prurito: "Prurito",
  secchezza_pelle: "Pelle secca", perdita_capelli: "Capelli", acne: "Acne",
  gonfiore: "Gonfiore", nausea: "Nausea", costipazione: "Costip.",
  fame: "Voglie", secchezza_vaginale: "Secch. vag.", dolore_rapporti: "Dolore rapp.",
  bassa_libido: "Libido", incontinenza: "Incontinen.", scosse_elettriche: "Scosse",
  acufeni: "Acufeni", bruciore_bocca: "Bocca", occhi_secchi: "Occhi secchi",
};

const CHART_PRIMARY = "oklch(0.52 0.08 155)";
const CHART_ACCENT = "oklch(0.68 0.13 40)";

export function Insights() {
  const [range, setRange] = useState(30);
  const rangeEntries = useMemo(() => loadEntriesForRange(range), [range]);
  const allEntries = useMemo(() => loadAllEntries(), []);

  const symptomBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of rangeEntries)
      for (const s of e.symptoms) counts[s] = (counts[s] || 0) + 1;
    return SYMPTOMS.map((s) => ({ name: SHORT[s.key] ?? s.key, count: counts[s.key] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [rangeEntries]);

  const trendLineData = useMemo(
    () =>
      [...rangeEntries]
        .reverse()
        .map((e) => ({
          date: e.date.slice(5),
          sintomi: e.symptoms.length,
        })),
    [rangeEntries]
  );

  const sleepLineData = useMemo(
    () =>
      [...rangeEntries]
        .reverse()
        .filter((e) => e.sleep.hours !== null)
        .map((e) => ({
          date: e.date.slice(5),
          ore: e.sleep.hours,
        })),
    [rangeEntries]
  );

  const stats = useMemo(() => {
    if (allEntries.length < 3) return null;

    const symptomCounts: Record<string, number> = {};
    for (const e of allEntries)
      for (const s of e.symptoms) symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

    const dayBuckets: Record<number, { total: number; count: number }> = {};
    for (const e of allEntries) {
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

    const withFlow = allEntries.filter((e) => e.flow !== null && e.flow !== "dry");
    const dry = allEntries.filter((e) => e.flow === "dry");
    const avgFlow = withFlow.length > 0
      ? withFlow.reduce((s, e) => s + e.symptoms.length, 0) / withFlow.length : null;
    const avgDry = dry.length > 0
      ? dry.reduce((s, e) => s + e.symptoms.length, 0) / dry.length : null;

    const withSleep = allEntries.filter((e) => e.sleep.quality !== null);
    let sleepCorrelation: "bad_sleep_more_symptoms" | "no_correlation" | null = null;
    if (withSleep.length >= 5) {
      const goodSleep = withSleep.filter((e) => (e.sleep.quality ?? 0) >= 4);
      const badSleep = withSleep.filter((e) => (e.sleep.quality ?? 5) <= 2);
      const avgGood = goodSleep.length > 0
        ? goodSleep.reduce((s, e) => s + e.symptoms.length, 0) / goodSleep.length : null;
      const avgBad = badSleep.length > 0
        ? badSleep.reduce((s, e) => s + e.symptoms.length, 0) / badSleep.length : null;
      if (avgGood !== null && avgBad !== null && avgBad > avgGood + 0.5)
        sleepCorrelation = "bad_sleep_more_symptoms";
      else if (avgGood !== null && avgBad !== null)
        sleepCorrelation = "no_correlation";
    }

    const sleepEntries = allEntries.filter((e) => e.sleep.hours !== null);
    const avgSleepHours = sleepEntries.length > 0
      ? sleepEntries.reduce((s, e) => s + (e.sleep.hours ?? 0), 0) / sleepEntries.length : null;

    const caffeineEntries = allEntries.filter((e) => e.context.caffeine);
    const noCaffeineEntries = allEntries.filter((e) => !e.context.caffeine);
    const avgWithCaffeine = caffeineEntries.length >= 3
      ? caffeineEntries.reduce((s, e) => s + e.symptoms.length, 0) / caffeineEntries.length : null;
    const avgNoCaffeine = noCaffeineEntries.length >= 3
      ? noCaffeineEntries.reduce((s, e) => s + e.symptoms.length, 0) / noCaffeineEntries.length : null;

    const now = Date.now();
    const last7 = allEntries.filter((e) => now - new Date(e.date + "T12:00:00").getTime() < 7 * 86400000);
    const prev7 = allEntries.filter((e) => {
      const diff = now - new Date(e.date + "T12:00:00").getTime();
      return diff >= 7 * 86400000 && diff < 14 * 86400000;
    });
    const last7Avg = last7.length > 0
      ? last7.reduce((s, e) => s + e.symptoms.length, 0) / last7.length : null;
    const prev7Avg = prev7.length > 0
      ? prev7.reduce((s, e) => s + e.symptoms.length, 0) / prev7.length : null;

    return {
      topSymptom, hardestDay, easiestDay, avgFlow, avgDry,
      sleepCorrelation, avgSleepHours, avgWithCaffeine, avgNoCaffeine,
      last7Avg, prev7Avg, total: allEntries.length,
    };
  }, [allEntries]);

  if (allEntries.length < 3) {
    return (
      <div className="pt-8 px-1">
        <h2 className="text-2xl mb-2">Insights</h2>
        <p className="text-[14.5px]" style={{ color: "var(--color-muted-foreground)" }}>
          Registra almeno 3 giornate per vedere i tuoi pattern. Tutto viene elaborato solo sul tuo dispositivo.
        </p>
      </div>
    );
  }

  const topSym = stats?.topSymptom
    ? SYMPTOMS.find((s) => s.key === stats.topSymptom![0])
    : null;
  const trendImproving =
    stats?.last7Avg !== null && stats?.prev7Avg !== null &&
    (stats?.last7Avg ?? 0) < (stats?.prev7Avg ?? 0) - 0.2;
  const trendWorsening =
    stats?.last7Avg !== null && stats?.prev7Avg !== null &&
    (stats?.last7Avg ?? 0) > (stats?.prev7Avg ?? 0) + 0.2;

  return (
    <div className="pt-6 flex flex-col gap-5 px-1">
      <div>
        <h2 className="text-2xl mb-1">Insights</h2>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Elaborati sul tuo dispositivo · {allEntries.length} registrazioni
        </p>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setRange(r.days)}
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all"
            style={{
              background: range === r.days
                ? "var(--color-primary)"
                : "var(--color-muted)",
              color: range === r.days ? "white" : "var(--color-muted-foreground)",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Symptom frequency chart */}
      {symptomBarData.length > 0 && (
        <section className="ms-card">
          <h3 className="font-semibold text-[14.5px] mb-4">Sintomi più frequenti</h3>
          <ResponsiveContainer width="100%" height={symptomBarData.length * 28 + 16}>
            <BarChart
              data={symptomBarData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)" }}
                formatter={(v: number) => [`${v} volte`, "Frequenza"]}
              />
              <Bar dataKey="count" fill={CHART_ACCENT} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Symptom trend over time */}
      {trendLineData.length > 2 && (
        <section className="ms-card">
          <h3 className="font-semibold text-[14.5px] mb-4">Sintomi nel tempo</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendLineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)" }}
                formatter={(v: number) => [v, "Sintomi"]}
              />
              <Line
                type="monotone"
                dataKey="sintomi"
                stroke={CHART_PRIMARY}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Sleep chart */}
      {sleepLineData.length > 2 && (
        <section className="ms-card">
          <h3 className="font-semibold text-[14.5px] mb-4">Ore di sonno</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sleepLineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 12]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)" }}
                formatter={(v: number) => [`${v}h`, "Sonno"]}
              />
              <Line
                type="monotone"
                dataKey="ore"
                stroke={CHART_PRIMARY}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* ── Statistical insight cards ── */}

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

      {topSym && stats?.topSymptom && (
        <div className="ms-card flex items-start gap-3">
          <span className="text-2xl leading-none">{topSym.emoji}</span>
          <div>
            <div className="font-semibold text-[14.5px]">Sintomo più presente</div>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              <strong>{topSym.label}</strong> è comparso in {stats.topSymptom[1]} giornate su {stats.total}.
            </p>
          </div>
        </div>
      )}

      {stats?.sleepCorrelation === "bad_sleep_more_symptoms" && (
        <div className="ms-card flex items-start gap-3">
          <Moon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
          <div>
            <div className="font-semibold text-[14.5px]">Sonno e sintomi correlati</div>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Nelle giornate dopo un sonno scarso tendi ad avere più sintomi. Priorità al sonno.
            </p>
          </div>
        </div>
      )}

      {stats?.avgSleepHours !== null && stats?.avgSleepHours !== undefined && (
        <div className="ms-card flex items-start gap-3">
          <Moon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
          <div>
            <div className="font-semibold text-[14.5px]">Media ore di sonno</div>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Dormi in media <strong>{stats.avgSleepHours.toFixed(1)}h</strong>.
              {stats.avgSleepHours < 6.5
                ? " Meno di 7h è associato a più sintomi in perimenopausa."
                : stats.avgSleepHours >= 7
                ? " Ottimo — 7-9h è il range raccomandato."
                : " Sei vicina al range raccomandato (7-9h)."}
            </p>
          </div>
        </div>
      )}

      {stats?.hardestDay !== null && stats?.easiestDay !== null &&
        stats?.hardestDay !== undefined && stats?.easiestDay !== undefined &&
        stats.hardestDay !== stats.easiestDay && (
          <div className="ms-card flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-accent)" }} />
            <div>
              <div className="font-semibold text-[14.5px]">Pattern settimanale</div>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                <strong>{DAY_NAMES[stats.hardestDay]}</strong> è tendenzialmente il giorno più
                difficile, <strong>{DAY_NAMES[stats.easiestDay]}</strong> il più sereno.
              </p>
            </div>
          </div>
        )}

      {stats?.avgFlow !== null && stats?.avgDry !== null &&
        stats?.avgFlow !== undefined && stats?.avgDry !== undefined && (
          <div className="ms-card flex items-start gap-3">
            <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-accent)" }} />
            <div>
              <div className="font-semibold text-[14.5px]">Flusso e sintomi</div>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                {stats.avgFlow > stats.avgDry
                  ? `Nei giorni con flusso hai in media ${(stats.avgFlow - stats.avgDry).toFixed(1)} sintomi in più rispetto ai giorni senza.`
                  : "Nei giorni senza flusso tendi ad avere più sintomi — tipico della perimenopausa."}
              </p>
            </div>
          </div>
        )}

      {stats?.avgWithCaffeine !== null && stats?.avgNoCaffeine !== null &&
        stats?.avgWithCaffeine !== undefined && stats?.avgNoCaffeine !== undefined &&
        stats.avgWithCaffeine > stats.avgNoCaffeine + 0.5 && (
          <div className="ms-card flex items-start gap-3">
            <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-accent)" }} />
            <div>
              <div className="font-semibold text-[14.5px]">Caffeina come trigger</div>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                Nei giorni con caffeina hai in media più sintomi. Potrebbe valere la pena ridurla.
              </p>
            </div>
          </div>
        )}

      <p className="text-[12px] text-center px-4 pt-1 pb-2" style={{ color: "var(--color-muted-foreground)" }}>
        Tutti i calcoli avvengono sul tuo dispositivo. Nessun dato viene inviato a server esterni.
      </p>
    </div>
  );
}
