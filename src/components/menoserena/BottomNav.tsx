import { CalendarDays, LineChart, Sparkles } from "lucide-react";

interface Props {
  active: "today" | "history" | "insights";
  onChange: (t: "today" | "history" | "insights") => void;
}

const TABS = [
  { key: "today" as const, label: "Oggi", Icon: CalendarDays },
  { key: "history" as const, label: "Cronologia", Icon: LineChart },
  { key: "insights" as const, label: "Insights", Icon: Sparkles },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg"
      style={{
        background: "color-mix(in oklab, var(--color-warm-cream) 92%, transparent)",
        borderColor: "var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto grid max-w-2xl grid-cols-3">
        {TABS.map(({ key, label, Icon }) => {
          const on = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-col items-center gap-1 py-2.5 transition-all"
              style={{
                color: on ? "var(--color-primary)" : "var(--color-muted-foreground)",
              }}
            >
              <Icon className="h-5 w-5" strokeWidth={on ? 2.4 : 1.8} />
              <span className="text-[11.5px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
