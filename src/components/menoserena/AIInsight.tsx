import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { calcStreak, loadAllEntries, todayKey, type DayEntry } from "@/lib/storage";
import { SYMPTOMS } from "@/components/menoserena/SymptomGrid";

const SHORT_LABELS: Record<string, string> = {
  vampata: "Vampate", sudorazione_notturna: "Sudorazioni notturne", ansia: "Ansia",
  sbalzi_umore: "Sbalzi d'umore", stanchezza: "Stanchezza", nebbia: "Nebbia cognitiva",
  mal_di_testa: "Mal di testa", palpitazioni: "Palpitazioni", gonfiore: "Gonfiore",
  bassa_libido: "Calo del desiderio", secchezza_vaginale: "Secchezza vaginale",
};

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildInsight(name: string | null, entries: DayEntry[]): string {
  if (entries.length < 2) return "";

  const firstName = name?.trim().split(" ")[0] ?? null;
  const hi = firstName ? `${firstName}, ` : "";

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const yesterday = sorted.find((e) => e.date === yesterdayKey());

  const sleepEntries = entries.filter((e) => e.sleep.hours !== null);
  const avgSleep =
    sleepEntries.length > 0
      ? sleepEntries.reduce((s, e) => s + (e.sleep.hours ?? 0), 0) / sleepEntries.length
      : null;

  // Rule 1: Last night's sleep vs average
  if (yesterday?.sleep.hours !== null && yesterday?.sleep.hours !== undefined && avgSleep !== null) {
    const yh = yesterday.sleep.hours ?? 0;
    const diff = yh - avgSleep;
    if (diff < -1.5 && yh > 0) {
      return `${hi}ieri hai dormito ${yh}h — più di un'ora sotto la tua media di ${avgSleep.toFixed(1)}h. Nei tuoi dati i giorni così tendono ad essere più intensi. Prenditi cura oggi.`;
    }
    if (diff > 1.2) {
      return `${hi}ieri hai dormito bene — ${yh}h contro la tua media di ${avgSleep.toFixed(1)}h. Giorni come questi tendono a essere più sereni.`;
    }
  }

  // Rule 2: Weekly trend
  const now = Date.now();
  const ms7 = 7 * 86400000;
  const last7 = entries.filter((e) => now - new Date(e.date + "T12:00:00").getTime() < ms7);
  const prev7 = entries.filter((e) => {
    const d = now - new Date(e.date + "T12:00:00").getTime();
    return d >= ms7 && d < 2 * ms7;
  });

  if (last7.length >= 3 && prev7.length >= 3) {
    const last7avg = last7.reduce((s, e) => s + e.symptoms.length, 0) / last7.length;
    const prev7avg = prev7.reduce((s, e) => s + e.symptoms.length, 0) / prev7.length;
    if (last7avg < prev7avg - 0.8) {
      return `Settimana più leggera rispetto alla precedente${firstName ? `, ${firstName}` : ""}. ${last7avg.toFixed(1)} sintomi al giorno contro ${prev7avg.toFixed(1)}. Il corpo oscilla — continua a registrare.`;
    }
    if (last7avg > prev7avg + 0.8) {
      return `Questa settimana è più intensa della precedente. È normale che ci siano picchi. Il diario ti aiuterà a trovare i trigger.`;
    }
  }

  // Rule 3: Caffeine trigger
  const withCaff = entries.filter((e) => e.context.caffeine);
  const noCaff = entries.filter((e) => !e.context.caffeine);
  if (withCaff.length >= 5 && noCaff.length >= 5) {
    const avgC = withCaff.reduce((s, e) => s + e.symptoms.length, 0) / withCaff.length;
    const avgN = noCaff.reduce((s, e) => s + e.symptoms.length, 0) / noCaff.length;
    if (avgC > avgN + 1.2) {
      return `Nei tuoi dati, con caffeina hai in media ${(avgC - avgN).toFixed(1)} sintomi in più al giorno. Potrebbe non essere una coincidenza — vale la pena provare a ridurla per una settimana.`;
    }
  }

  // Rule 4: Top symptom frequency
  const counts: Record<string, number> = {};
  for (const e of entries)
    for (const s of e.symptoms) counts[s] = (counts[s] || 0) + 1;
  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (topEntry && topEntry[1] >= 5) {
    const sym = SYMPTOMS.find((s) => s.key === topEntry[0]);
    const label = SHORT_LABELS[topEntry[0]] ?? sym?.label ?? topEntry[0];
    const pct = Math.round((topEntry[1] / entries.length) * 100);
    if (pct >= 40) {
      return `${sym?.emoji ?? ""} ${label} ${pct >= 60 ? "è il tuo sintomo principale" : "compare spesso"} — ${pct}% delle giornate. Il tuo ginecologo ha bisogno di saperlo con precisione.`;
    }
  }

  // Rule 5: Streak milestones
  const streak = calcStreak();
  if (streak === 7) return `7 giorni di fila 🌱 I tuoi pattern stanno emergendo. Continua — ogni giornata vale.`;
  if (streak === 14) return `Due settimane${firstName ? `, ${firstName}` : ""}. Hai già abbastanza dati per la prossima visita.`;
  if (streak === 30) return `Un mese completo${firstName ? `, ${firstName}` : ""}. Questo è il diario clinico più preciso che puoi portare al ginecologo.`;

  // Rule 6: Sleep quality correlation
  if (sleepEntries.length >= 7 && avgSleep !== null && avgSleep < 6.2) {
    return `La tua media di sonno è ${avgSleep.toFixed(1)}h — sotto il range ottimale di 7-9h. In perimenopausa il sonno insufficiente amplifica ogni altro sintomo.`;
  }

  return "";
}

interface Props {
  name: string | null;
}

export function AIInsight({ name }: Props) {
  const entries = useMemo(() => loadAllEntries(), []);
  const todayStr = todayKey();

  const insight = useMemo(() => {
    const cacheKey = `menoserena_insight_${todayStr}`;
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) return cached;
    const generated = buildInsight(name, entries);
    if (generated && typeof window !== "undefined") {
      localStorage.setItem(cacheKey, generated);
    }
    return generated;
  }, [name, entries, todayStr]);

  if (!insight) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-4 py-3.5 mb-1"
      style={{
        background: "color-mix(in oklab, var(--color-sage) 18%, var(--color-card))",
        border: "1px solid color-mix(in oklab, var(--color-sage) 30%, transparent)",
      }}
    >
      <Sparkles
        className="h-4 w-4 mt-0.5 shrink-0"
        style={{ color: "var(--color-sage-deep)" }}
      />
      <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--color-foreground)" }}>
        {insight}
      </p>
    </div>
  );
}
