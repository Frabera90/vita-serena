import { CalendarDays, CalendarRange, Lightbulb, User } from "lucide-react";

export type AppTab = "today" | "calendar" | "insights" | "profile";

interface Props {
  active: AppTab;
  onChange: (t: AppTab) => void;
}

const TABS: { key: AppTab; label: string; Icon: React.FC<{ className?: string; strokeWidth?: number }> }[] = [
  { key: "today", label: "Oggi", Icon: CalendarDays },
  { key: "calendar", label: "Calendario", Icon: CalendarRange },
  { key: "insights", label: "Insights", Icon: Lightbulb },
  { key: "profile", label: "Profilo", Icon: User },
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
      <div className="mx-auto grid max-w-2xl grid-cols-4">
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
              <span className="text-[10.5px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
