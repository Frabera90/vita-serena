import jsPDF from "jspdf";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  calcRemedyCompliance,
  loadEntriesForRange,
  loadRemedies,
  type Intensity,
} from "@/lib/storage";
import { SYMPTOMS } from "./SymptomGrid";

const FLOW_LABEL: Record<string, string> = {
  dry: "Nessun flusso",
  spotting: "Spotting",
  heavy: "Abbondante",
};

const AREA_LABEL: Record<string, string> = {
  neck: "Collo / cervicale",
  shoulders: "Spalle",
  wrists: "Mani / polsi",
  chest: "Seno / petto",
  lower_back: "Bassa schiena*",
  knees: "Ginocchia",
};

const QUALITY_LABEL = ["", "Pessimo", "Scarso", "Discreto", "Buono", "Ottimo"];

const SHORT: Record<string, string> = {
  vampata: "Vampata", sudorazione_notturna: "Sudor. notturna", ansia: "Ansia",
  sbalzi_umore: "Sbalzi d'umore", irritabilita: "Irritabilità", umore_depresso: "Umore depresso",
  pianto_facile: "Pianto facile", attacco_panico: "Attacchi panico", nebbia: "Nebbia cognitiva",
  stanchezza: "Stanchezza", mal_di_testa: "Mal di testa", capogiri: "Capogiri",
  palpitazioni: "Palpitazioni", formicolio: "Formicolio", prurito: "Prurito",
  secchezza_pelle: "Pelle secca", perdita_capelli: "Perdita capelli", acne: "Acne",
  gonfiore: "Gonfiore", nausea: "Nausea", costipazione: "Costipazione",
  fame: "Voglie alimentari", secchezza_vaginale: "Secch. vaginale", dolore_rapporti: "Dolore rapporti",
  bassa_libido: "Bassa libido", incontinenza: "Incontinenza", scosse_elettriche: "Scosse elettriche",
  acufeni: "Acufeni", bruciore_bocca: "Bruciore bocca", occhi_secchi: "Occhi secchi",
};

const INTENSITY_COLOR: Record<string, [number, number, number]> = {
  light: [253, 224, 71],
  moderate: [251, 146, 60],
  severe: [239, 68, 68],
};

const INTENSITY_LABEL: Record<string, string> = {
  light: "Lieve",
  moderate: "Moderato",
  severe: "Forte",
};

const PAIN_SEVERITY: Record<string, number> = { light: 1, moderate: 2, severe: 3 };

// [relX, relY] offsets from body center (cx, ty)
const PAIN_POSITIONS: Record<string, [number, number][]> = {
  neck: [[0, 32]],
  shoulders: [[-24, 44], [24, 44]],
  chest: [[0, 72]],
  wrists: [[-37, 96], [37, 96]],
  lower_back: [[0, 100]],
  knees: [[-11, 152], [11, 152]],
};

const fmtDate = (d: string): string => {
  const [yr, mo, day] = d.split("-");
  const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return `${parseInt(day)} ${MONTHS[parseInt(mo) - 1]} ${yr}`;
};

export function PDFReport() {
  const generate = () => {
    const entries = loadEntriesForRange(30);
    const remedies = loadRemedies();

    if (entries.length === 0) {
      toast.error("Nessun dato registrato negli ultimi 30 giorni.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const M = 48;
    const W = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = M;

    const checkPage = (needed = 40) => {
      if (y + needed > pageH - 65) {
        doc.addPage();
        y = M;
      }
    };

    const sectionTitle = (title: string) => {
      checkPage(58);
      y += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(80, 70, 56);
      doc.text(title, M, y);
      y += 6;
      doc.setDrawColor(212, 202, 184);
      doc.setLineWidth(0.5);
      doc.line(M, y, W - M, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(56, 50, 42);
    };

    const textLine = (txt: string) => {
      checkPage(18);
      const wrapped = doc.splitTextToSize(txt, W - M * 2);
      doc.text(wrapped, M, y);
      y += wrapped.length * 14;
    };

    // ── Aggregation ──────────────────────────────────────────────────────────

    const sortedAsc = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = sortedAsc[0].date;
    const lastDate = sortedAsc[sortedAsc.length - 1].date;

    const symptomCounts: Record<string, number> = {};
    for (const e of entries)
      for (const s of e.symptoms) symptomCounts[s] = (symptomCounts[s] || 0) + 1;

    const topSymptoms = SYMPTOMS
      .map((s) => ({ key: s.key, label: SHORT[s.key] ?? s.label, count: symptomCounts[s.key] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const avgSympPerDay = entries.reduce((s, e) => s + e.symptoms.length, 0) / entries.length;

    const flowDays = entries
      .filter((e) => e.flow && e.flow !== "dry")
      .sort((a, b) => b.date.localeCompare(a.date));

    const sleepEntries = entries.filter((e) => e.sleep.hours !== null);
    const avgSleepH =
      sleepEntries.length > 0
        ? sleepEntries.reduce((s, e) => s + (e.sleep.hours ?? 0), 0) / sleepEntries.length
        : null;
    const qualityEntries = entries.filter((e) => e.sleep.quality !== null);
    const avgSleepQ =
      qualityEntries.length > 0
        ? qualityEntries.reduce((s, e) => s + (e.sleep.quality ?? 0), 0) / qualityEntries.length
        : null;

    const weights = entries.filter((e) => e.weight !== null).map((e) => e.weight!);
    const minW = weights.length ? Math.min(...weights) : null;
    const maxW = weights.length ? Math.max(...weights) : null;
    const avgW = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : null;

    const painAgg: Record<string, Intensity> = {};
    for (const e of entries) {
      for (const [area, intensity] of Object.entries(e.painMap)) {
        if (!intensity) continue;
        const cur = painAgg[area];
        if (!cur || PAIN_SEVERITY[intensity] > PAIN_SEVERITY[cur as string])
          painAgg[area] = intensity as Intensity;
      }
    }
    const hasPainData = Object.values(painAgg).some(Boolean);

    // ── PAGE 1 ────────────────────────────────────────────────────────────────

    // Header banner
    doc.setFillColor(105, 135, 96);
    doc.rect(0, 0, W, 68, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("MenoSerena — Diario Medico", M, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Periodo: ${fmtDate(firstDate)} — ${fmtDate(lastDate)}   ·   ${entries.length} giorni tracciati su 30`,
      M,
      54
    );
    y = 86;
    doc.setTextColor(56, 50, 42);

    // Summary box
    {
      const bH = 44;
      const bY = y;
      doc.setFillColor(248, 245, 238);
      doc.setDrawColor(212, 202, 184);
      doc.setLineWidth(0.5);
      doc.roundedRect(M, bY, W - M * 2, bH, 6, 6, "FD");

      const cols: { label: string; value: string }[] = [
        { label: "Giorni tracciati", value: `${entries.length} / 30` },
        { label: "Sintomi / giorno", value: avgSympPerDay.toFixed(1) },
        ...(avgSleepH !== null ? [{ label: "Sonno medio", value: `${avgSleepH.toFixed(1)}h` }] : []),
        ...(avgW !== null ? [{ label: "Peso medio", value: `${avgW.toFixed(1)} kg` }] : []),
      ];
      const cW = (W - M * 2) / cols.length;
      cols.forEach((col, i) => {
        const cx = M + cW * i + cW / 2;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 100, 82);
        doc.text(col.label, cx, bY + 16, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(78, 66, 50);
        doc.text(col.value, cx, bY + 34, { align: "center" });
      });
      doc.setTextColor(56, 50, 42);
      y = bY + bH + 10;
    }

    // Flusso
    sectionTitle("Ciclo e flusso");
    if (flowDays.length === 0) {
      textLine("Nessun giorno con flusso registrato nel periodo.");
    } else {
      for (const fd of flowDays.slice(0, 10)) {
        textLine(`${fmtDate(fd.date)} — ${FLOW_LABEL[fd.flow!]}`);
      }
      if (flowDays.length > 10) textLine(`…e altri ${flowDays.length - 10} giorni con flusso`);
    }

    // Top sintomi — manual bar chart
    if (topSymptoms.length > 0) {
      sectionTitle("Sintomi più frequenti");
      const maxCount = topSymptoms[0].count;
      const labelW = 148;
      const barMaxW = W - M * 2 - labelW - 36;
      const barH = 10;

      for (const sym of topSymptoms) {
        checkPage(20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(56, 50, 42);
        doc.text(sym.label, M, y);

        const barW = Math.max(3, (sym.count / maxCount) * barMaxW);
        doc.setFillColor(185, 128, 82);
        doc.roundedRect(M + labelW, y - barH, barW, barH, 2, 2, "F");

        doc.setFontSize(9.5);
        doc.setTextColor(120, 110, 92);
        doc.text(`${sym.count}x`, M + labelW + barMaxW + 8, y);
        y += 18;
      }
      y += 4;
    }

    // Sonno
    if (avgSleepH !== null || avgSleepQ !== null) {
      sectionTitle("Sonno");
      if (avgSleepH !== null)
        textLine(`Ore medie: ${avgSleepH.toFixed(1)}h  (su ${sleepEntries.length} notti registrate)`);
      if (avgSleepQ !== null)
        textLine(
          `Qualità media: ${avgSleepQ.toFixed(1)} / 5 — ${QUALITY_LABEL[Math.round(avgSleepQ)]}`
        );
    }

    // Peso
    if (avgW !== null && minW !== null && maxW !== null) {
      sectionTitle("Peso");
      textLine(`Media: ${avgW.toFixed(1)} kg   Min: ${minW.toFixed(1)} kg   Max: ${maxW.toFixed(1)} kg`);
    }

    // Rimedi
    if (remedies.length > 0) {
      sectionTitle("Rimedi e integratori in corso");
      for (const r of remedies) {
        const dayN = Math.max(1, Math.floor((Date.now() - new Date(r.startDate + "T12:00:00").getTime()) / 86400000) + 1);
        const compDays = Math.min(dayN, 30);
        const taken = calcRemedyCompliance(r.id, compDays);
        const pct = compDays > 0 ? Math.round((taken / compDays) * 100) : 0;
        textLine(`• ${r.name}   Giorno ${dayN}   Assunzione: ${taken}/${compDays} giorni (${pct}%)`);
      }
    }

    // ── PAGE 2: Mappa del dolore ──────────────────────────────────────────────

    if (hasPainData) {
      doc.addPage();
      y = M;

      // Section header
      y += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(80, 70, 56);
      doc.text("Mappa del dolore — intensità massima rilevata nel periodo", M, y);
      y += 6;
      doc.setDrawColor(212, 202, 184);
      doc.setLineWidth(0.5);
      doc.line(M, y, W - M, y);
      y += 24;

      const cx = M + 95; // body center X (left column)
      const ty = y;      // body top Y

      // Body shape — cream fill, warm stroke
      doc.setFillColor(240, 236, 222);
      doc.setDrawColor(172, 160, 138);
      doc.setLineWidth(1);

      // Head
      doc.ellipse(cx, ty + 14, 13, 15, "FD");
      // Neck
      doc.rect(cx - 5, ty + 27, 10, 11, "FD");
      // Shoulders bar
      doc.roundedRect(cx - 28, ty + 37, 56, 13, 3, 3, "FD");
      // Torso
      doc.roundedRect(cx - 18, ty + 48, 36, 56, 3, 3, "FD");
      // Left arm
      doc.roundedRect(cx - 38, ty + 37, 11, 70, 4, 4, "FD");
      // Right arm
      doc.roundedRect(cx + 27, ty + 37, 11, 70, 4, 4, "FD");
      // Pelvis
      doc.roundedRect(cx - 20, ty + 102, 40, 14, 3, 3, "FD");
      // Left leg
      doc.roundedRect(cx - 18, ty + 114, 14, 65, 4, 4, "FD");
      // Right leg
      doc.roundedRect(cx + 4, ty + 114, 14, 65, 4, 4, "FD");

      // Pain indicators
      for (const [area, positions] of Object.entries(PAIN_POSITIONS)) {
        const intensity = painAgg[area];
        if (!intensity) continue;
        const [r, g, b] = INTENSITY_COLOR[intensity as string];
        doc.setFillColor(r, g, b);
        doc.setDrawColor(200, 190, 172);
        doc.setLineWidth(0.5);
        for (const [relX, relY] of positions) {
          doc.circle(cx + relX, ty + relY, 8, "FD");
        }
      }

      // Right column: legend + area list
      const rx = M + 215;
      let ry = ty + 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(80, 70, 56);
      doc.text("Legenda intensità:", rx, ry);
      ry += 18;

      const legendItems = [
        { key: "light", label: "Lieve" },
        { key: "moderate", label: "Moderato" },
        { key: "severe", label: "Forte" },
      ];
      for (const item of legendItems) {
        const [r, g, b] = INTENSITY_COLOR[item.key];
        doc.setFillColor(r, g, b);
        doc.setDrawColor(180, 170, 155);
        doc.setLineWidth(0.5);
        doc.roundedRect(rx, ry - 9, 12, 12, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(56, 50, 42);
        doc.text(item.label, rx + 18, ry);
        ry += 17;
      }

      ry += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(80, 70, 56);
      doc.text("Aree interessate:", rx, ry);
      ry += 17;

      for (const [area, areaLabel] of Object.entries(AREA_LABEL)) {
        const intensity = painAgg[area];
        if (!intensity) continue;
        const [r, g, b] = INTENSITY_COLOR[intensity as string];
        doc.setFillColor(r, g, b);
        doc.setDrawColor(180, 170, 155);
        doc.setLineWidth(0.5);
        doc.circle(rx + 6, ry - 4, 5, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(56, 50, 42);
        doc.text(`${areaLabel} — ${INTENSITY_LABEL[intensity as string]}`, rx + 17, ry);
        ry += 17;
      }

      ry += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(128, 118, 100);
      doc.text("* schiena: visualizzata su vista anteriore", rx, ry);
      doc.text("Vista anteriore · intensità massima del periodo", rx, ry + 13);

      y = ty + 190;
    }

    // Footer on all pages
    const totalPages: number = (doc.internal as any).getNumberOfPages?.() ?? 1;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(212, 202, 184);
      doc.setLineWidth(0.5);
      doc.line(M, pageH - 50, W - M, pageH - 50);
      doc.setFontSize(8.5);
      doc.setTextColor(128, 118, 100);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Dati elaborati localmente sul dispositivo. Non condivisi con terzi.",
        M,
        pageH - 34
      );
      doc.text(
        `MenoSerena · Diario perimenopausa · pag. ${p}/${totalPages}`,
        M,
        pageH - 20
      );
    }

    doc.save(`MenoSerena_Report_${lastDate}.pdf`);
    toast.success("Report medico generato!");
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
      <p className="text-sm mb-1" style={{ color: "var(--color-muted-foreground)" }}>
        30 giorni · mappa del dolore · assunzione rimedi. Sempre{" "}
        <span className="font-semibold">gratis</span>.
      </p>
      <p className="text-[12px] mb-4" style={{ color: "var(--color-muted-foreground)" }}>
        Porta il PDF al ginecologo per ricevere una diagnosi precisa in 15 minuti.
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
        Genera report medico (30 gg)
      </button>
    </section>
  );
}
