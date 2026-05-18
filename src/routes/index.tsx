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
import { BottomNav } from "@/components/menoserena/BottomNav";
import { PremiumCTA } from "@/components/menoserena/PremiumCTA";
import { History } from "@/components/menoserena/History";
import { Insights } from "@/components/menoserena/Insights";
import {
  emptyEntry,
  loadEntry,
  saveEntry,
  todayKey,
  type DayEntry,
  type Flow,
  type Intensity,
  type PainArea,
  type SymptomKey,
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
        content: "Privato, semplice, in italiano. Capisce i cicli caotici della perimenopausa.",
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
  const [tab, setTab] = useState<"today" | "history" | "insights">("today");
  const [entry, setEntry] = useState<DayEntry>(() => emptyEntry(todayKey()));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntry(loadEntry(todayKey()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveEntry(entry);
  }, [entry, hydrated]);

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

  return (
    <>
      <PrivacyBanner />
      <main className="mx-auto max-w-2xl px-4 pt-5 pb-28">
        {tab === "today" && (
          <>
            <header className="mb-5 px-1">
              <p
                className="text-[12.5px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--color-sage-deep)" }}
              >
                {formatItalianDate(new Date())}
              </p>
              <h1
                className="text-3xl mt-1"
                style={{ color: "var(--color-foreground)" }}
              >
                Ciao. Come va oggi?
              </h1>
              <p
                className="text-[14.5px] mt-1.5"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Prenditi un momento. Tu capisci il tuo corpo meglio di chiunque.
              </p>
            </header>

            <div className="flex flex-col gap-4">
              <FlowTracker value={entry.flow} onChange={setFlow} />
              <VoiceRecorder
                notes={entry.notes}
                onAdd={addNote}
                onRemove={removeNote}
              />
              <SymptomGrid selected={entry.symptoms} onToggle={toggleSymptom} />
              <PainMap map={entry.painMap} onChange={setPain} />
              <Remedies />
              <PDFReport entry={entry} />
              <PremiumCTA />
            </div>
          </>
        )}

        {tab === "history" && <History />}

        {tab === "insights" && <Insights />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <Toaster position="top-center" richColors />
    </>
  );
}
