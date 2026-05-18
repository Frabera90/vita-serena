import { Sparkles } from "lucide-react";

export function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="ms-card flex flex-col items-center text-center py-12">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "var(--color-muted)", color: "var(--color-accent)" }}
      >
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-2xl mb-2">{title}</h2>
      <p className="text-[14.5px] max-w-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {desc}
      </p>
      <span className="ms-pill mt-5" style={{ background: "var(--color-terracotta-soft)", color: "var(--color-accent)" }}>
        Disponibile in Premium
      </span>
    </div>
  );
}
