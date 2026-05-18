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
  // Vasomotori
  | "vampata"
  | "sudorazione_notturna"
  // Psicologici / emotivi
  | "ansia"
  | "sbalzi_umore"
  | "irritabilita"
  | "umore_depresso"
  | "pianto_facile"
  | "attacco_panico"
  // Cognitivi
  | "nebbia"
  // Fisici generali
  | "stanchezza"
  | "mal_di_testa"
  | "capogiri"
  | "palpitazioni"
  | "formicolio"
  // Cutanei / capelli
  | "prurito"
  | "secchezza_pelle"
  | "perdita_capelli"
  | "acne"
  // Digestivi
  | "gonfiore"
  | "nausea"
  | "costipazione"
  | "fame"
  // Urogenitali / sessuali
  | "secchezza_vaginale"
  | "dolore_rapporti"
  | "bassa_libido"
  | "incontinenza"
  // Sintomi rari ma reali
  | "scosse_elettriche"
  | "acufeni"
  | "bruciore_bocca"
  | "occhi_secchi";

export type SleepDisturbance =
  | "falling_asleep"
  | "waking_up"
  | "early_waking"
  | "restless";

export type ActivityLevel = "none" | "light" | "moderate" | "intense";
export type WaterLevel = "low" | "medium" | "high";

export interface SleepData {
  hours: number | null;
  quality: 1 | 2 | 3 | 4 | 5 | null;
  disturbances: SleepDisturbance[];
}

export interface ContextData {
  stressLevel: 1 | 2 | 3 | 4 | 5 | null;
  activity: ActivityLevel | null;
  water: WaterLevel | null;
  caffeine: boolean;
  alcohol: boolean;
}

export interface DayEntry {
  date: string;
  flow: Flow;
  symptoms: SymptomKey[];
  painMap: Record<PainArea, Intensity>;
  notes: { kind: "voice" | "text"; text: string; time: string }[];
  sleep: SleepData;
  weight: number | null;
  context: ContextData;
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

const EMPTY_SLEEP: SleepData = { hours: null, quality: null, disturbances: [] };
const EMPTY_CONTEXT: ContextData = {
  stressLevel: null,
  activity: null,
  water: null,
  caffeine: false,
  alcohol: false,
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
  sleep: { ...EMPTY_SLEEP },
  weight: null,
  context: { ...EMPTY_CONTEXT },
  timestamp: Date.now(),
});

export const loadEntry = (date: string): DayEntry => {
  if (typeof window === "undefined") return emptyEntry(date);
  try {
    const raw = localStorage.getItem(`menoserena_${date}`);
    if (!raw) return emptyEntry(date);
    const parsed = JSON.parse(raw) as Partial<DayEntry>;
    const empty = emptyEntry(date);
    return {
      ...empty,
      ...parsed,
      painMap: { ...EMPTY_PAIN, ...(parsed.painMap || {}) },
      notes: parsed.notes || [],
      symptoms: parsed.symptoms || [],
      sleep: { ...EMPTY_SLEEP, ...(parsed.sleep || {}) },
      context: { ...EMPTY_CONTEXT, ...(parsed.context || {}) },
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
  e.flow !== null ||
  e.symptoms.length > 0 ||
  e.notes.length > 0 ||
  e.sleep.hours !== null ||
  e.weight !== null;

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
