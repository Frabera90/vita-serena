import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SymptomKey } from "@/lib/storage";

interface SymptomDef {
  key: SymptomKey;
  emoji: string;
  label: string;
  sub: string;
}

interface Category {
  id: string;
  label: string;
  symptoms: SymptomDef[];
  rare?: boolean;
}

export const SYMPTOMS: SymptomDef[] = [
  // Vasomotori
  { key: "vampata", emoji: "🔥", label: "Vampata / brivido", sub: "Caldo o freddo improvviso" },
  { key: "sudorazione_notturna", emoji: "💦", label: "Sudorazione notturna", sub: "Mi sveglio bagnata" },
  // Psicologici
  { key: "ansia", emoji: "💭", label: "Ansia improvvisa", sub: "Senza motivo apparente" },
  { key: "sbalzi_umore", emoji: "🎢", label: "Sbalzi d'umore", sub: "Da ok a no in poco tempo" },
  { key: "irritabilita", emoji: "😤", label: "Irritabilità", sub: "Tolleranza bassa, nervosismo" },
  { key: "umore_depresso", emoji: "🌧️", label: "Umore depresso", sub: "Tristezza, vuoto, poco interesse" },
  { key: "pianto_facile", emoji: "😢", label: "Pianto facile", sub: "Le lacrime arrivano facilmente" },
  { key: "attacco_panico", emoji: "😰", label: "Attacco di panico", sub: "Paura improvvisa, cuore in gola" },
  // Cognitivi
  { key: "nebbia", emoji: "🌫️", label: "Nebbia cerebrale", sub: "Memoria, concentrazione" },
  // Fisici generali
  { key: "stanchezza", emoji: "🪫", label: "Stanchezza / esaurimento", sub: "Anche dopo aver dormito" },
  { key: "mal_di_testa", emoji: "🤕", label: "Mal di testa", sub: "Cefalea o emicrania" },
  { key: "capogiri", emoji: "🌀", label: "Capogiri / vertigini", sub: "Senso di instabilità" },
  { key: "palpitazioni", emoji: "💓", label: "Palpitazioni", sub: "Cuore che batte forte" },
  { key: "formicolio", emoji: "⚡", label: "Formicolio / intorpidimento", sub: "Mani, piedi, viso" },
  // Cutanei / capelli
  { key: "prurito", emoji: "✨", label: "Prurito diffuso", sub: "Sul corpo, senza rash" },
  { key: "secchezza_pelle", emoji: "🏜️", label: "Pelle secca", sub: "Perde elasticità, tira" },
  { key: "perdita_capelli", emoji: "🪮", label: "Perdita di capelli", sub: "Più del solito, capelli sottili" },
  { key: "acne", emoji: "🔴", label: "Acne ormonale", sub: "Brufoli, specialmente al mento" },
  // Digestivi
  { key: "gonfiore", emoji: "🫧", label: "Gonfiore addominale", sub: "Pancia gonfia, tensione" },
  { key: "nausea", emoji: "🤢", label: "Nausea", sub: "Stomaco fastidioso" },
  { key: "costipazione", emoji: "😣", label: "Costipazione", sub: "Intestino lento" },
  { key: "fame", emoji: "🍫", label: "Voglie / fame nervosa", sub: "Impulso improvviso a mangiare" },
  // Urogenitali / sessuali
  { key: "secchezza_vaginale", emoji: "🌵", label: "Secchezza vaginale", sub: "Fastidio, bruciore, prurito" },
  { key: "dolore_rapporti", emoji: "💔", label: "Dolore nei rapporti", sub: "Disagio o dolore durante il sesso" },
  { key: "bassa_libido", emoji: "📉", label: "Basso desiderio sessuale", sub: "Calo della libido" },
  { key: "incontinenza", emoji: "💧", label: "Incontinenza / urgenza", sub: "Perdite o stimolo improvviso" },
  // Rari ma reali
  { key: "scosse_elettriche", emoji: "⚡", label: "Scosse elettriche", sub: "Brevi scariche nel corpo" },
  { key: "acufeni", emoji: "👂", label: "Acufeni / tinnito", sub: "Fischi o ronzii nelle orecchie" },
  { key: "bruciore_bocca", emoji: "🔥", label: "Bruciore alla bocca", sub: "Lingua, labbra, gengive" },
  { key: "occhi_secchi", emoji: "👁️", label: "Occhi secchi", sub: "Bruciore, sfocatura visiva" },
];

const CATEGORIES: Category[] = [
  {
    id: "vasomotori",
    label: "🌡️ Vampate & Temperatura",
    symptoms: SYMPTOMS.filter((s) => ["vampata", "sudorazione_notturna"].includes(s.key)),
  },
  {
    id: "psicologici",
    label: "🧠 Umore & Mente",
    symptoms: SYMPTOMS.filter((s) =>
      ["ansia", "sbalzi_umore", "irritabilita", "umore_depresso", "pianto_facile", "attacco_panico", "nebbia"].includes(s.key)
    ),
  },
  {
    id: "fisici",
    label: "💪 Corpo & Energia",
    symptoms: SYMPTOMS.filter((s) =>
      ["stanchezza", "mal_di_testa", "capogiri", "palpitazioni", "formicolio"].includes(s.key)
    ),
  },
  {
    id: "cutanei",
    label: "🧴 Pelle & Capelli",
    symptoms: SYMPTOMS.filter((s) =>
      ["prurito", "secchezza_pelle", "perdita_capelli", "acne"].includes(s.key)
    ),
  },
  {
    id: "digestivi",
    label: "🫁 Digestivo",
    symptoms: SYMPTOMS.filter((s) =>
      ["gonfiore", "nausea", "costipazione", "fame"].includes(s.key)
    ),
  },
  {
    id: "urogenitali",
    label: "🌸 Zona pelvica & Sessuale",
    symptoms: SYMPTOMS.filter((s) =>
      ["secchezza_vaginale", "dolore_rapporti", "bassa_libido", "incontinenza"].includes(s.key)
    ),
  },
  {
    id: "rari",
    label: "🔬 Rari ma reali",
    symptoms: SYMPTOMS.filter((s) =>
      ["scosse_elettriche", "acufeni", "bruciore_bocca", "occhi_secchi"].includes(s.key)
    ),
    rare: true,
  },
];

interface Props {
  selected: SymptomKey[];
  onToggle: (k: SymptomKey) => void;
}

function SymptomButton({
  s,
  isOn,
  onToggle,
}: {
  s: SymptomDef;
  isOn: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.97]"
      style={{
        borderColor: isOn ? "var(--color-accent)" : "var(--color-border)",
        background: isOn
          ? "color-mix(in oklab, var(--color-accent) 10%, var(--color-card))"
          : "var(--color-card)",
      }}
    >
      <span className="text-xl leading-none">{s.emoji}</span>
      <div className="font-semibold text-[13px] leading-tight">{s.label}</div>
      <div
        className="text-[11.5px] leading-tight"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        {s.sub}
      </div>
    </button>
  );
}

export function SymptomGrid({ selected, onToggle }: Props) {
  const [showRare, setShowRare] = useState(false);

  const visibleCategories = CATEGORIES.filter((c) => !c.rare || showRare);
  const rareCount = selected.filter((k) =>
    ["scosse_elettriche", "acufeni", "bruciore_bocca", "occhi_secchi"].includes(k)
  ).length;

  return (
    <section className="ms-card">
      <header className="mb-4">
        <h2 className="text-xl">Sintomi di oggi</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Tocca tutti quelli che hai. Puoi anche non sceglierne nessuno.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {visibleCategories.map((cat) => (
          <div key={cat.id}>
            <p
              className="text-[12px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cat.symptoms.map((s) => (
                <SymptomButton
                  key={s.key}
                  s={s}
                  isOn={selected.includes(s.key)}
                  onToggle={() => onToggle(s.key)}
                />
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowRare((v) => !v)}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
        >
          {showRare ? (
            <><ChevronUp className="h-4 w-4" /> Nascondi sintomi rari</>
          ) : (
            <><ChevronDown className="h-4 w-4" /> Sintomi rari ma reali{rareCount > 0 ? ` (${rareCount} selezionati)` : ""}</>
          )}
        </button>
      </div>
    </section>
  );
}
