import { Lock } from "lucide-react";

export function PrivacyBanner() {
  return (
    <div
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        background: "color-mix(in oklab, var(--color-warm-cream) 88%, transparent)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--color-sage)", color: "var(--color-sage-deep)" }}
        >
          <Lock className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <p className="text-[13.5px] leading-snug" style={{ color: "var(--color-foreground)" }}>
          <span className="font-semibold">I tuoi dati sono protetti.</span>{" "}
          <span style={{ color: "var(--color-muted-foreground)" }}>
            Salvati solo su questo telefono. Mai in cloud.
          </span>
        </p>
      </div>
    </div>
  );
}
