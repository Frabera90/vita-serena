import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { PrivacyBanner } from "@/components/menoserena/PrivacyBanner";
import { FlowTracker } from "@/components/menoserena/FlowTracker";
import { VoiceRecorder } from "@/components/menoserena/VoiceRecorder";
import { SymptomGrid } from "@/components/menoserena/SymptomGrid";
import { PainMap } from "@/components/menoserena/PainMap";
import { Remedies } from "@/components/menoserena/Remedies";
import { PDFReport } from "@/components/menoserena/PDFReport";
import { BottomNav, type AppTab } from "@/components/menoserena/BottomNav";
import { PremiumCTA } from "@/components/menoserena/PremiumCTA";
import { Insights } from "@/components/menoserena/Insights";
import { SleepTracker } from "@/components/menoserena/SleepTracker";
import { DailyWellness } from "@/components/menoserena/DailyWellness";
import { Onboarding } from "@/components/menoserena/Onboarding";
import { CalendarView } from "@/components/menoserena/CalendarView";
import { ProfileTab } from "@/components/menoserena/ProfileTab";
import { StreakBadge } from "@/components/menoserena/StreakBadge";
import { ReminderBanner } from "@/components/menoserena/ReminderBanner";
import { DoctorQuestions } from "@/components/menoserena/DoctorQuestions";
import { BreathingExercise } from "@/components/menoserena/BreathingExercise";
import {
  emptyEntry,
  loadEntry,
  loadProfile,
  saveEntry,
  todayKey,
  type ContextData,
  type DayEntry,
  type Flow,
  type Intensity,
  type PainArea,
  type SleepData,
  type SymptomKey,
  type UserProfile,
} from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenoSerena — Diario perimenopausa, privato e gentile" },
      {
        name: "description",
        content:
          "L'app italiana per tracciare i sintomi della perimenopausa. Cicli irregolari, voice notes, mappa del dolore. I tuoi dati restano solo sul tuo telefono.",
      },
      { property: "og:title", content: "MenoSerena — Diario perimenopausa" },
      {
        property: "og:description",
        content:
          "Privato, semplice, in italiano. Capisce i cicli caotici della perimenopausa.",
      },
    ],
  }),
  component: Home,
});

function formatItalianDate(d: Date): string {
  return d
    .toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function Home() {
  const [tab, setTab] = useState<AppTab>("today");
  const [entry, setEntry] = useState<DayEntry>(() => emptyEntry(todayKey()));
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setEntry(loadEntry(todayKey()));
    const p = loadProfile();
    setProfile(p);
    if (!p.onboardingComplete) setShowOnboarding(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveEntry(entry);
  }, [entry, hydrated]);

  const handleOnboardingComplete = (p: UserProfile) => {
    setProfile(p);
    setShowOnboarding(false);
  };

  const setFlow = (flow: Flow) => setEntry((e) => ({ ...e, flow }));
  const toggleSymptom = (k: SymptomKey) =>
    setEntry((e) => ({
      ...e,
      symptoms: e.symptoms.includes(k)
        ? e.symptoms.filter((x) => x !== k)
        : [...e.symptoms, k],
    }));
  const setPain = (area: PainArea, intensity: Intensity) =>
    setEntry((e) => ({ ...e, painMap: { ...e.painMap, [area]: intensity } }));
  const addNote = (n: DayEntry["notes"][number]) =>
    setEntry((e) => ({ ...e, notes: [...e.notes, n] }));
  const removeNote = (idx: number) =>
    setEntry((e) => ({ ...e, notes: e.notes.filter((_, i) => i !== idx) }));
  const setSleep = (sleep: SleepData) => setEntry((e) => ({ ...e, sleep }));
  const setWeight = (weight: number | null) => setEntry((e) => ({ ...e, weight }));
  const setContext = (context: ContextData) => setEntry((e) => ({ ...e, context }));

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <PrivacyBanner />
      <main className="mx-auto max-w-2xl px-4 pt-5 pb-28">
        {tab === "today" && (
          <>
            <header className="mb-4 px-1">
              <p
                className="text-[12.5px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--color-sage-deep)" }}
              >
                {formatItalianDate(new Date())}
              </p>
              <div className="flex items-center justify-between mt-1">
                <h1 className="text-3xl" style={{ color: "var(--color-foreground)" }}>
                  Ciao. Come va oggi?
                </h1>
                <StreakBadge />
              </div>
              <p
                className="text-[14.5px] mt-1.5"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Prenditi un momento. Tu capisci il tuo corpo meglio di chiunque.
              </p>
            </header>

            {profile && <ReminderBanner profile={profile} />}

            <div className="flex flex-col gap-4 mt-4">
              <SleepTracker sleep={entry.sleep} onChange={setSleep} />
              <FlowTracker value={entry.flow} onChange={setFlow} />
              <SymptomGrid selected={entry.symptoms} onToggle={toggleSymptom} />
              <PainMap map={entry.painMap} onChange={setPain} />
              <DailyWellness
                weight={entry.weight}
                context={entry.context}
                onWeightChange={setWeight}
                onContextChange={setContext}
              />
              <VoiceRecorder notes={entry.notes} onAdd={addNote} onRemove={removeNote} />
              <Remedies />
              <DoctorQuestions />
              <BreathingExercise />
              <PDFReport entry={entry} />
              <PremiumCTA />
            </div>
          </>
        )}

        {tab === "calendar" && <CalendarView />}

        {tab === "insights" && <Insights />}

        {tab === "profile" && <ProfileTab />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <Toaster position="top-center" richColors />
    </>
  );
}
