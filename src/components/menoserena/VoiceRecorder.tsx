import { useEffect, useRef, useState } from "react";
import { Mic, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Note {
  kind: "voice" | "text";
  text: string;
  time: string;
}

interface Props {
  notes: Note[];
  onAdd: (n: Note) => void;
  onRemove: (idx: number) => void;
}

const fmtTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function VoiceRecorder({ notes, onAdd, onRemove }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [supported, setSupported] = useState(true);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");

  const startedAt = useRef<number>(0);
  const timer = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = async () => {
    if (!supported) {
      setWriting(true);
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      startedAt.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timer.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      }, 250);
    } catch {
      setSupported(false);
      setWriting(true);
      toast("Microfono non disponibile — puoi scrivere una nota.");
    }
  };

  const stop = () => {
    if (!recording) return;
    const secs = Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000));
    if (timer.current) window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setRecording(false);
    onAdd({
      kind: "voice",
      text: `Nota vocale (${secs}s)`,
      time: fmtTime(),
    });
    toast.success("Nota vocale salvata");
  };

  const saveText = () => {
    if (!draft.trim()) {
      setWriting(false);
      return;
    }
    onAdd({ kind: "text", text: draft.trim(), time: fmtTime() });
    setDraft("");
    setWriting(false);
    toast.success("Nota salvata");
  };

  return (
    <section className="ms-card">
      <header className="mb-5">
        <h2 className="text-xl">Come stai oggi?</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Racconta liberamente. Nessuna categoria, nessun giudizio.
        </p>
      </header>

      {!writing && (
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={() => recording && stop()}
            className={`flex h-28 w-28 select-none items-center justify-center rounded-full transition-all ${recording ? "recording" : "active:scale-95"}`}
            style={{
              background: recording
                ? "var(--color-destructive)"
                : "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              touchAction: "none",
            }}
            aria-label="Tieni premuto per registrare"
          >
            <Mic className="h-10 w-10" strokeWidth={2.2} />
          </button>
          <div className="text-center">
            <div className="font-semibold text-[15px]">
              {recording ? `Sto ascoltando… ${elapsed}s` : "Tieni premuto e racconta"}
            </div>
            <div className="text-[12.5px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {recording ? "Rilascia per salvare" : "in italiano, come preferisci"}
            </div>
          </div>
          <button
            onClick={() => setWriting(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--color-trust)" }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Preferisco scrivere
          </button>
        </div>
      )}

      {writing && (
        <div className="flex flex-col gap-3 py-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Scrivi come ti senti…"
            rows={4}
            className="w-full resize-none rounded-xl border-2 p-3 text-[15px] outline-none focus:border-[color:var(--color-primary)]"
            style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
          />
          <div className="flex gap-2">
            <button
              onClick={saveText}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold"
              style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              <Check className="h-4 w-4" /> Salva
            </button>
            <button
              onClick={() => { setWriting(false); setDraft(""); }}
              className="rounded-xl border-2 px-4 py-3 font-medium"
              style={{ borderColor: "var(--color-border)" }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
          {notes.map((n, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "var(--color-muted)" }}
            >
              <span className="text-base mt-0.5">{n.kind === "voice" ? "🎤" : "✍️"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] break-words">{n.text}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  {n.time}
                </div>
              </div>
              <button
                onClick={() => onRemove(i)}
                aria-label="Elimina nota"
                className="shrink-0 rounded-full p-1.5 hover:bg-[color:var(--color-border)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
