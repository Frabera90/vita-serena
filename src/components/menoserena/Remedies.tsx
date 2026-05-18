import { useEffect, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { loadRemedies, saveRemedies, type Remedy } from "@/lib/storage";

const dayCount = (startDate: string): number => {
  const start = new Date(startDate + "T12:00:00");
  const today = new Date();
  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
};

export function Remedies() {
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setRemedies(loadRemedies());
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
        <ul className="flex flex-col gap-2">
          {remedies.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-xl px-3.5 py-3"
              style={{ background: "var(--color-muted)" }}
            >
              <span className="font-medium text-[14.5px]">{r.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
                  style={{
                    background: "var(--color-terracotta-soft)",
                    color: "var(--color-accent)",
                  }}
                >
                  Giorno {dayCount(r.startDate)}
                </span>
                <button
                  onClick={() => remove(r.id)}
                  className="rounded-full p-1 transition-all active:scale-90 hover:opacity-60"
                  aria-label="Rimuovi"
                >
                  <X className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
