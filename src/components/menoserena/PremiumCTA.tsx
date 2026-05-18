import { Crown, Check } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  "Grafici storici di 6-12 mesi",
  "AI Insights sui rimedi più efficaci",
  "Export CSV dei tuoi dati",
  "Backup cloud opzionale e cifrato",
];

export function PremiumCTA() {
  return (
    <section
      className="ms-card relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, var(--color-sage-deep), color-mix(in oklab, var(--color-sage-deep) 70%, var(--color-trust)))",
        color: "var(--color-primary-foreground)",
        borderColor: "transparent",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Crown className="h-4 w-4" />
        <span className="text-[12px] font-bold tracking-wider uppercase opacity-90">In arrivo</span>
      </div>
      <h2 className="text-2xl mb-1" style={{ color: "var(--color-primary-foreground)" }}>
        MenoSerena Premium
      </h2>
      <p className="text-[14px] opacity-85 mb-4">
        Vai più a fondo nei tuoi pattern. Privacy sempre al primo posto.
      </p>

      <ul className="flex flex-col gap-2 mb-5">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[14px]">
            <Check className="h-4 w-4 mt-0.5 shrink-0 opacity-90" />
            <span className="opacity-95">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => toast("Premium disponibile presto — restiamo in contatto!")}
        className="w-full rounded-2xl px-5 py-3.5 font-semibold transition-all active:scale-[0.98]"
        style={{
          background: "var(--color-warm-cream)",
          color: "var(--color-sage-deep)",
        }}
      >
        Prova 30 giorni gratis
      </button>
    </section>
  );
}
