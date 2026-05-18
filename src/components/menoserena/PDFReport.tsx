import jsPDF from "jspdf";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import type { DayEntry } from "@/lib/storage";
import { SYMPTOMS } from "./SymptomGrid";
import { ACTIVE_REMEDIES } from "./Remedies";

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

interface Props {
  entry: DayEntry;
}

export function PDFReport({ entry }: Props) {
  const generate = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const M = 48;
    let y = M;
    const W = doc.internal.pageSize.getWidth();

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
      const wrapped = doc.splitTextToSize(txt, W - M * 2);
      doc.text(wrapped, M, y);
      y += wrapped.length * 14;
    };

    section("Flusso");
    line(entry.flow ? FLOW_LABEL[entry.flow] : "Non registrato");

    section("Sintomi");
    if (entry.symptoms.length === 0) line("Nessun sintomo registrato.");
    else
      entry.symptoms.forEach((k) => {
        const s = SYMPTOMS.find((x) => x.key === k);
        if (s) line(`• ${s.label}`);
      });

    section("Mappa del dolore");
    const painLines = Object.entries(entry.painMap)
      .filter(([, v]) => v)
      .map(([a, v]) => `• ${AREA_LABEL[a]}: ${INT_LABEL[v as string]}`);
    if (painLines.length === 0) line("Nessun dolore registrato.");
    else painLines.forEach(line);

    section("Note");
    if (entry.notes.length === 0) line("Nessuna nota.");
    else entry.notes.forEach((n) => line(`[${n.time}] ${n.kind === "voice" ? "🎤" : "✍️"} ${n.text}`));

    section("Rimedi in uso");
    ACTIVE_REMEDIES.forEach((r) => line(`• ${r.name} — Giorno ${r.day}`));

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220);
    doc.line(M, pageH - 50, W - M, pageH - 50);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Dati salvati localmente sul dispositivo. Non condivisi con terzi.",
      M,
      pageH - 32
    );
    doc.text("MenoSerena · per te, e per il tuo ginecologo.", M, pageH - 18);

    doc.save(`MenoSerena_Report_${entry.date}.pdf`);
    toast.success("Report generato!");
  };

  return (
    <section className="ms-card" style={{
      background: "linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 8%, var(--color-card)), var(--color-card))",
    }}>
      <h2 className="text-xl mb-1.5">Report per il ginecologo</h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted-foreground)" }}>
        Dati concreti, non solo impressioni. Sempre <span className="font-semibold">gratis</span>.
      </p>
      <button
        onClick={generate}
        className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15.5px] font-semibold transition-all active:scale-[0.98]"
        style={{
          background: "var(--color-accent)",
          color: "var(--color-accent-foreground)",
          boxShadow: "0 10px 24px -10px color-mix(in oklab, var(--color-accent) 70%, transparent)",
        }}
      >
        <FileDown className="h-5 w-5" />
        Genera report PDF
      </button>
    </section>
  );
}
