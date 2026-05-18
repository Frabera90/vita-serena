import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { loadEntriesForRange, type SymptomKey } from "@/lib/storage";

const QUESTIONS: Partial<Record<SymptomKey, string>> = {
  vampata: "Ho vampate frequenti durante il giorno. Quali opzioni terapeutiche esistono oltre alla TOS?",
  sudorazione_notturna: "Le sudorazioni notturne mi svegliano più volte. Ci sono rimedi non ormonali efficaci?",
  ansia: "Sento ansia improvvisa che non riconosco come mia. Può essere correlata alle fluttuazioni di estrogeno?",
  sbalzi_umore: "Ho sbalzi d'umore rapidi e intensi. Come distinguo i sintomi ormonali da un problema dell'umore?",
  irritabilita: "Sono irritabile in modo insolito, senza motivi chiari. È correlato alla perimenopausa?",
  umore_depresso: "Ho frequenti episodi di umore depresso e apatia. Come si distingue dalla depressione clinica?",
  pianto_facile: "Mi vengono le lacrime facilmente, anche per cose piccole. È normale in questa fase?",
  attacco_panico: "Ho episodi che sembrano attacchi di panico. Possono essere innescati dalle variazioni ormonali?",
  nebbia: "Ho difficoltà di concentrazione e memoria. Quanto dura la nebbia cerebrale e cosa si può fare?",
  stanchezza: "Sono esausta anche dopo aver dormito. Esistono cause ormonali specifiche da valutare?",
  mal_di_testa: "Ho cefalee più frequenti del solito. Possono essere legate alle fluttuazioni di estrogeno?",
  capogiri: "Ho capogiri e senso di instabilità ricorrenti. Devo fare accertamenti specifici?",
  palpitazioni: "Sento il cuore che batte forte o irregolare. Devo fare un ECG o è correlato agli ormoni?",
  formicolio: "Sento formicolio e intorpidimento alle mani o al viso. È un sintomo della perimenopausa?",
  prurito: "Ho prurito diffuso sul corpo senza eruzioni. Può essere un sintomo ormonale?",
  secchezza_pelle: "La mia pelle è diventata molto secca. Esistono trattamenti dermatologici consigliati?",
  perdita_capelli: "Sto perdendo molti capelli. È reversibile e ci sono cause ormonali da indagare?",
  acne: "Ho acne ormonale al mento e alla mascella. Ci sono approcci specifici per la perimenopausa?",
  gonfiore: "Ho gonfiore addominale ricorrente. Può essere correlato alle variazioni di progesterone?",
  nausea: "Ho episodi di nausea senza causa evidente. Può essere un sintomo della perimenopausa?",
  costipazione: "Ho costipazione più frequente del solito. È correlata al calo degli estrogeni?",
  fame: "Ho voglie intense e fame nervosa. Come gestirle tenendo conto del metabolismo che cambia?",
  secchezza_vaginale: "Ho secchezza vaginale e fastidio. Quali opzioni esistono, incluse quelle topiche locali?",
  dolore_rapporti: "Ho dolore durante i rapporti sessuali. Esistono trattamenti efficaci che non richiedano TOS?",
  bassa_libido: "Il mio desiderio sessuale è molto diminuito. Ci sono approcci terapeutici consigliati?",
  incontinenza: "Ho perdite urinarie involontarie. Quando è il caso di rivolgermi a un urologo o fisioterapista?",
  scosse_elettriche: "Sento brevi scosse elettriche nel corpo. È un sintomo della perimenopausa? È sicuro?",
  acufeni: "Ho ronzii o fischi nelle orecchie comparsi recentemente. Possono essere correlati agli estrogeni?",
  bruciore_bocca: "Sento bruciore alla bocca e alla lingua. Può essere la 'Burning Mouth Syndrome' da menopausa?",
  occhi_secchi: "Gli occhi sono molto secchi e mi bruciano. È correlato alle variazioni ormonali?",
};

export function DoctorQuestions() {
  const [open, setOpen] = useState(false);

  const questions = useMemo(() => {
    const entries = loadEntriesForRange(30);
    if (entries.length < 3) return [];

    const counts: Record<string, number> = {};
    for (const e of entries)
      for (const s of e.symptoms) counts[s] = (counts[s] || 0) + 1;

    return Object.entries(counts)
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => ({ key: key as SymptomKey, question: QUESTIONS[key as SymptomKey] }))
      .filter((q) => q.question !== undefined) as { key: SymptomKey; question: string }[];
  }, []);

  const copyQuestion = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    toast.success("Copiato!");
  };

  if (questions.length === 0) return null;

  return (
    <section className="ms-card">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent)" }} />
          <div>
            <h2 className="text-xl leading-tight">Domande per il ginecologo</h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Basate sugli ultimi 30 giorni · {questions.length} domande
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
        )}
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-2.5">
          <p className="text-[13px]" style={{ color: "var(--color-muted-foreground)" }}>
            Tocca 📋 per copiare la domanda e portarla alla visita.
          </p>
          {questions.map(({ key, question }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-xl px-3.5 py-3"
              style={{ background: "var(--color-muted)" }}
            >
              <p className="flex-1 text-[13.5px] leading-snug font-medium">{question}</p>
              <button
                onClick={() => copyQuestion(question)}
                className="shrink-0 rounded-lg p-1.5 transition-all active:scale-90 hover:opacity-70"
                aria-label="Copia"
              >
                <Copy className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
