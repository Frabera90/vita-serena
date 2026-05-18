import { useEffect, useState } from "react";
import { Check, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  loadRemedies,
  loadTakenRemedies,
  saveRemedies,
  saveTakenRemedies,
  todayKey,
  type Remedy,
} from "@/lib/storage";

const dayCount = (startDate: string): number => {
  const start = new Date(startDate + "T12:00:00");
  const today = new Date();
  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
};

export function Remedies() {
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setRemedies(loadRemedies());
    setTakenToday(new Set(loadTakenRemedies(todayKey())));
  }, []);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const updated = [...remedies, { id: Date.now().toString(), name, startDate }];
    setRemedies(updated);
    saveRemedies(updated);
    setDraft("");
    setAdding(false);
    toast.success(`"${name}" aggiunto.`);
  };

  const remove = (id: string) => {
    const updated = remedies.filter((r) => r.id !== id);
    setRemedies(updated);
    saveRemedies(updated);
  };

  const toggleTaken = (id: string) => {
    setTakenToday((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveTakenRemedies(todayKey(), [...next]);
      return next;
    });
  };

  return (
    <section className="ms-card">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
          <h2 className="text-xl">Cosa stai usando</h2>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Aggiungi
        </button>
      </header>

      {adding && (
        <div className="mb-3 flex gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Es. Integratore Magnesio…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") { setAdding(false); setDraft(""); }
            }}
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
          <button
            onClick={add}
            disabled={!draft.trim()}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            Salva
          </button>
        </div>
      )}

      {remedies.length === 0 ? (
        <p className="text-[13.5px]" style={{ color: "var(--color-muted-foreground)" }}>
          Nessun rimedio ancora. Tocca "Aggiungi" per iniziare a tracciare.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {remedies.map((r) => {
            const taken = takenToday.has(r.id);
            return (
              <li
                key={r.id}
                className="flex items-center gap-2 rounded-xl px-3.5 py-3"
                style={{ background: "var(--color-muted)" }}
              >
                {/* Taken toggle */}
                <button
                  onClick={() => toggleTaken(r.id)}
                  className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{
                    width: 32,
                    height: 32,
                    background: taken
                      ? "var(--color-primary)"
                      : "color-mix(in oklab, var(--color-primary) 10%, var(--color-card))",
                    border: `2px solid ${taken ? "var(--color-primary)" : "color-mix(in oklab, var(--color-primary) 30%, transparent)"}`,
                  }}
                  aria-label={taken ? "Segna come non preso" : "Segna come preso"}
                >
                  <Check
                    className="h-4 w-4"
                    style={{ color: taken ? "white" : "var(--color-primary)", opacity: taken ? 1 : 0.4 }}
                  />
                </button>

                {/* Name + day count */}
                <div className="flex-1 min-w-0">
                  <span
                    className="font-medium text-[14.5px] block truncate"
                    style={{
                      color: taken ? "var(--color-foreground)" : "var(--color-foreground)",
                      opacity: taken ? 0.65 : 1,
                    }}
                  >
                    {r.name}
                  </span>
                  <span className="text-[11.5px]" style={{ color: "var(--color-muted-foreground)" }}>
                    {taken ? "Preso oggi · " : ""}Giorno {dayCount(r.startDate)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => remove(r.id)}
                  className="shrink-0 rounded-full p-1 transition-all active:scale-90 hover:opacity-60"
                  aria-label="Rimuovi"
                >
                  <X className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {remedies.length > 0 && (
        <p className="mt-3 text-[11.5px]" style={{ color: "var(--color-muted-foreground)" }}>
          Tocca il cerchio per registrare l'assunzione di oggi. Tracciato nel report medico.
        </p>
      )}
    </section>
  );
}
