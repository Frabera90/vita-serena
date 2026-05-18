import jsPDF from "jspdf";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import type { DayEntry } from "@/lib/storage";
import { loadRemedies } from "@/lib/storage";
import { SYMPTOMS } from "./SymptomGrid";

const FLOW_LABEL: Record<string, string> = {
  dry: "Nessun flusso / secco",
  spotting: "Spotting / perdite irregolari",
  heavy: "Flusso abbondante",
};

const AREA_LABEL: Record<string, string> = {
  neck: "Collo / cervicale",
  shoulders: "Spalle",
  wrists: "Mani / polsi",
  chest: "Seno",
  lower_back: "Bassa schiena",
  knees: "Ginocchia",
};

const INT_LABEL: Record<string, string> = {
  light: "lieve",
  moderate: "moderato",
  severe: "forte",
};

const QUALITY_LABEL = ["", "Pessimo", "Scarso", "Discreto", "Buono", "Ottimo"];
const DISTURBANCE_LABEL: Record<string, string> = {
  falling_asleep: "Difficile addormentarsi",
  waking_up: "Risvegli notturni",
  early_waking: "Sveglia troppo presto",
  restless: "Sonno agitato",
};
const ACTIVITY_LABEL: Record<string, string> = {
  none: "Nessuna",
  light: "Leggera",
  moderate: "Moderata",
  intense: "Intensa",
};
const WATER_LABEL: Record<string, string> = {
  low: "Poca",
  medium: "Media",
  high: "Tanta",
};
const STRESS_LABEL = ["", "Calma", "Ok", "Un po'", "Tanto", "Enorme"];

interface Props {
  entry: DayEntry;
}

export function PDFReport({ entry }: Props) {
  const generate = () => {
    const remedies = loadRemedies();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const M = 48;
    let y = M;
    const W = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const checkPage = (needed = 40) => {
      if (y + needed > pageH - 60) {
        doc.addPage();
        y = M;
      }
    };

    // Header
    doc.setFillColor(120, 145, 110);
    doc.rect(0, 0, W, 70, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MenoSerena — Report", M, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${entry.date}`, M, 58);
    y = 100;
    doc.setTextColor(40);

    const section = (title: string) => {
      checkPage(50);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(title, M, y);
      y += 6;
      doc.setDrawColor(200);
      doc.line(M, y, W - M, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    };

    const line = (txt: string) => {
      checkPage(20);
      const wrapped = doc.splitTextToSize(txt, W - M * 2);
      doc.text(wrapped, M, y);
      y += wrapped.length * 14;
    };

    // Flusso
    section("Flusso");
    line(entry.flow ? FLOW_LABEL[entry.flow] : "Non registrato");

    // Sonno
    section("Sonno");
    if (entry.sleep.hours !== null) line(`Ore dormite: ${entry.sleep.hours}h`);
    if (entry.sleep.quality !== null)
      line(`Qualità: ${QUALITY_LABEL[entry.sleep.quality]} (${entry.sleep.quality}/5)`);
    if (entry.sleep.disturbances.length > 0)
      line(`Problemi: ${entry.sleep.disturbances.map((d) => DISTURBANCE_LABEL[d]).join(", ")}`);
    if (!entry.sleep.hours && !entry.sleep.quality && entry.sleep.disturbances.length === 0)
      line("Non registrato");

    // Peso
    if (entry.weight !== null) {
      section("Peso");
      line(`${entry.weight.toFixed(1)} kg`);
    }

    // Sintomi
    section("Sintomi");
    if (entry.symptoms.length === 0) line("Nessun sintomo registrato.");
    else
      entry.symptoms.forEach((k) => {
        const s = SYMPTOMS.find((x) => x.key === k);
        if (s) line(`• ${s.label}`);
      });

    // Mappa del dolore
    section("Mappa del dolore");
    const painLines = Object.entries(entry.painMap)
      .filter(([, v]) => v)
      .map(([a, v]) => `• ${AREA_LABEL[a]}: ${INT_LABEL[v as string]}`);
    if (painLines.length === 0) line("Nessun dolore registrato.");
    else painLines.forEach(line);

    // Benessere
    section("Benessere generale");
    const c = entry.context;
    if (c.stressLevel) line(`Stress: ${STRESS_LABEL[c.stressLevel]} (${c.stressLevel}/5)`);
    if (c.activity) line(`Attività fisica: ${ACTIVITY_LABEL[c.activity]}`);
    if (c.water) line(`Acqua: ${WATER_LABEL[c.water]}`);
    const triggers = [c.caffeine && "Caffeina", c.alcohol && "Alcol"].filter(Boolean);
    if (triggers.length > 0) line(`Trigger: ${triggers.join(", ")}`);
    if (!c.stressLevel && !c.activity && !c.water && !c.caffeine && !c.alcohol)
      line("Non registrato");

    // Note
    section("Note");
    if (entry.notes.length === 0) line("Nessuna nota.");
    else
      entry.notes.forEach((n) =>
        line(`[${n.time}] ${n.kind === "voice" ? "(Nota vocale)" : "(Nota scritta)"} ${n.text}`)
      );

    // Rimedi
    section("Rimedi in uso");
    if (remedies.length === 0) line("Nessun rimedio registrato.");
    else {
      const today = new Date();
      remedies.forEach((r) => {
        const days = Math.max(
          1,
          Math.floor((today.getTime() - new Date(r.startDate + "T12:00:00").getTime()) / 86400000) + 1
        );
        line(`• ${r.name} — Giorno ${days}`);
      });
    }

    // Footer
    doc.setDrawColor(220);
    doc.line(M, pageH - 50, W - M, pageH - 50);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Dati salvati localmente sul dispositivo. Non condivisi con terzi.", M, pageH - 32);
    doc.text("MenoSerena · per te, e per il tuo ginecologo.", M, pageH - 18);

    doc.save(`MenoSerena_Report_${entry.date}.pdf`);
    toast.success("Report generato!");
  };

  return (
    <section
      className="ms-card"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 8%, var(--color-card)), var(--color-card))",
      }}
    >
      <h2 className="text-xl mb-1.5">Report per il ginecologo</h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted-foreground)" }}>
        Dati concreti, non solo impressioni. Sempre{" "}
        <span className="font-semibold">gratis</span>.
      </p>
      <button
        onClick={generate}
        className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15.5px] font-semibold transition-all active:scale-[0.98]"
        style={{
          background: "var(--color-accent)",
          color: "var(--color-accent-foreground)",
          boxShadow:
            "0 10px 24px -10px color-mix(in oklab, var(--color-accent) 70%, transparent)",
        }}
      >
        <FileDown className="h-5 w-5" />
        Genera report PDF
      </button>
    </section>
  );
}
