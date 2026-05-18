export type Flow = "dry" | "spotting" | "heavy" | null;
export type Intensity = "light" | "moderate" | "severe" | null;
export type PainArea =
  | "neck"
  | "shoulders"
  | "wrists"
  | "chest"
  | "lower_back"
  | "knees";

export type SymptomKey =
  | "vampata"
  | "ansia"
  | "nebbia"
  | "prurito"
  | "palpitazioni"
  | "fame";

export interface DayEntry {
  date: string;
  flow: Flow;
  symptoms: SymptomKey[];
  painMap: Record<PainArea, Intensity>;
  notes: { kind: "voice" | "text"; text: string; time: string }[];
  timestamp: number;
}

const EMPTY_PAIN: Record<PainArea, Intensity> = {
  neck: null,
  shoulders: null,
  wrists: null,
  chest: null,
  lower_back: null,
  knees: null,
};

export const todayKey = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const emptyEntry = (date: string): DayEntry => ({
  date,
  flow: null,
  symptoms: [],
  painMap: { ...EMPTY_PAIN },
  notes: [],
  timestamp: Date.now(),
});

export const loadEntry = (date: string): DayEntry => {
  if (typeof window === "undefined") return emptyEntry(date);
  try {
    const raw = localStorage.getItem(`menoserena_${date}`);
    if (!raw) return emptyEntry(date);
    const parsed = JSON.parse(raw) as DayEntry;
    return {
      ...emptyEntry(date),
      ...parsed,
      painMap: { ...EMPTY_PAIN, ...(parsed.painMap || {}) },
      notes: parsed.notes || [],
      symptoms: parsed.symptoms || [],
    };
  } catch {
    return emptyEntry(date);
  }
};

export const saveEntry = (entry: DayEntry) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `menoserena_${entry.date}`,
    JSON.stringify({ ...entry, timestamp: Date.now() })
  );
};

export interface Remedy {
  id: string;
  name: string;
  startDate: string;
}

export const loadRemedies = (): Remedy[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("menoserena_remedies");
    if (!raw) return [];
    return JSON.parse(raw) as Remedy[];
  } catch {
    return [];
  }
};

export const saveRemedies = (remedies: Remedy[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("menoserena_remedies", JSON.stringify(remedies));
};

const hasData = (e: DayEntry) =>
  e.flow !== null || e.symptoms.length > 0 || e.notes.length > 0;

export const loadAllEntries = (): DayEntry[] => {
  if (typeof window === "undefined") return [];
  const entries: DayEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("menoserena_") || key === "menoserena_remedies") continue;
    const date = key.replace("menoserena_", "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const entry = loadEntry(date);
    if (hasData(entry)) entries.push(entry);
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
};

export const loadEntriesForRange = (days: number): DayEntry[] => {
  if (typeof window === "undefined") return [];
  const entries: DayEntry[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    if (!localStorage.getItem(`menoserena_${key}`)) continue;
    const entry = loadEntry(key);
    if (hasData(entry)) entries.push(entry);
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
};
