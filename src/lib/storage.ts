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

export const hasData = (e: DayEntry) =>
  e.flow !== null ||
  e.symptoms.length > 0 ||
  e.notes.length > 0 ||
  e.sleep.hours !== null ||
  e.weight !== null;

const NON_DATE_KEYS = new Set(["menoserena_remedies", "menoserena_profile"]);

export const loadAllEntries = (): DayEntry[] => {
  if (typeof window === "undefined") return [];
  const entries: DayEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("menoserena_") || NON_DATE_KEYS.has(key)) continue;
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

// ─── User Profile ────────────────────────────────────────────────────────────

export type MenopauseStage =
  | "perimenopause_early"
  | "perimenopause_late"
  | "menopause"
  | "postmenopause"
  | "unknown";

export interface UserProfile {
  stage: MenopauseStage;
  birthYear: number | null;
  lastPeriodDate: string | null;
  topConcerns: SymptomKey[];
  notificationTime: string | null;
  onboardingComplete: boolean;
}

export const defaultProfile = (): UserProfile => ({
  stage: "unknown",
  birthYear: null,
  lastPeriodDate: null,
  topConcerns: [],
  notificationTime: null,
  onboardingComplete: false,
});

export const loadProfile = (): UserProfile => {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = localStorage.getItem("menoserena_profile");
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return defaultProfile();
  }
};

export const saveProfile = (p: UserProfile) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("menoserena_profile", JSON.stringify(p));
};

// ─── Streak ──────────────────────────────────────────────────────────────────

export const calcStreak = (): number => {
  if (typeof window === "undefined") return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    const raw = localStorage.getItem(`menoserena_${key}`);
    if (!raw) break;
    try {
      const e = loadEntry(key);
      if (hasData(e)) streak++;
      else break;
    } catch {
      break;
    }
  }
  return streak;
};

// ─── Reminder Banner ─────────────────────────────────────────────────────────

export const shouldShowReminderBanner = (profile: UserProfile): boolean => {
  if (!profile.notificationTime) return false;
  if (typeof window === "undefined") return false;
  const todayEntry = loadEntry(todayKey());
  if (hasData(todayEntry)) return false;
  const [hh, mm] = profile.notificationTime.split(":").map(Number);
  const now = new Date();
  return now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm);
};

// ─── CSV Export ──────────────────────────────────────────────────────────────

export const exportCSV = (): string => {
  const entries = loadAllEntries();
  const sep = ";";
  const headers = [
    "Data", "Flusso", "Ore Sonno", "Qualità Sonno", "Disturbi Sonno",
    "Peso (kg)", "Sintomi", "Dolore", "Stress", "Attività", "Acqua",
    "Caffeina", "Alcol", "Note",
  ];
  const rows = entries.map((e) => [
    e.date,
    e.flow ?? "",
    e.sleep.hours?.toString() ?? "",
    e.sleep.quality?.toString() ?? "",
    e.sleep.disturbances.join("|"),
    e.weight?.toString() ?? "",
    e.symptoms.join("|"),
    Object.entries(e.painMap).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join("|"),
    e.context.stressLevel?.toString() ?? "",
    e.context.activity ?? "",
    e.context.water ?? "",
    e.context.caffeine ? "sì" : "no",
    e.context.alcohol ? "sì" : "no",
    e.notes.map((n) => n.text.replace(/"/g, "'")).join(" | "),
  ]);
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(sep))
    .join("\n");
};

export const downloadCSV = () => {
  const csv = exportCSV();
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MenoSerena_export_${todayKey()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
