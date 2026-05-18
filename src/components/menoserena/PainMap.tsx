import type { Intensity, PainArea } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  map: Record<PainArea, Intensity>;
  onChange: (area: PainArea, next: Intensity) => void;
}

const NEXT: Record<string, Intensity> = {
  null: "light",
  light: "moderate",
  moderate: "severe",
  severe: null,
};

const LABEL_AREA: Record<PainArea, string> = {
  neck: "Collo / cervicale",
  shoulders: "Spalle",
  wrists: "Mani / polsi",
  chest: "Seno",
  lower_back: "Bassa schiena",
  knees: "Ginocchia",
};

const LABEL_INTENSITY: Record<NonNullable<Intensity>, string> = {
  light: "lieve",
  moderate: "moderato",
  severe: "forte",
};

const colorFor = (i: Intensity): string => {
  if (i === "light") return "var(--color-pain-light)";
  if (i === "moderate") return "var(--color-pain-moderate)";
  if (i === "severe") return "var(--color-pain-severe)";
  return "var(--color-muted)";
};

// Hotspot positions over the figure (percentages of the SVG viewBox 200x420)
const HOTSPOTS: { area: PainArea; cx: number; cy: number; r: number }[] = [
  { area: "neck", cx: 100, cy: 78, r: 14 },
  { area: "shoulders", cx: 100, cy: 110, r: 22 },
  { area: "chest", cx: 100, cy: 150, r: 18 },
  { area: "wrists", cx: 48, cy: 220, r: 14 },
  { area: "lower_back", cx: 100, cy: 230, r: 20 },
  { area: "knees", cx: 100, cy: 320, r: 18 },
];

export function PainMap({ map, onChange }: Props) {
  const cycle = (a: PainArea) => {
    const cur = map[a];
    const next = NEXT[String(cur)];
    onChange(a, next);
    if (next) toast(`${LABEL_AREA[a]} — ${LABEL_INTENSITY[next]}`);
    else toast(`${LABEL_AREA[a]} — rimosso`);
  };

  return (
    <section className="ms-card">
      <header className="mb-4">
        <h2 className="text-xl">Dove fa male oggi?</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Tocca un'area per cambiare intensità. Tocca di nuovo per togliere.
        </p>
      </header>

      <div className="flex gap-4 items-start">
        <div className="relative shrink-0">
          <svg viewBox="0 0 200 420" className="w-[170px] h-auto">
            {/* Stylized body silhouette */}
            <g
              fill="var(--color-muted)"
              stroke="var(--color-border)"
              strokeWidth="1.5"
            >
              {/* head */}
              <circle cx="100" cy="40" r="26" />
              {/* neck */}
              <rect x="92" y="64" width="16" height="14" rx="4" />
              {/* torso */}
              <path d="M60 90 Q100 80 140 90 L150 200 Q100 220 50 200 Z" />
              {/* arms */}
              <path d="M60 95 Q40 150 45 220 Q50 245 38 245 Q32 200 50 95 Z" />
              <path d="M140 95 Q160 150 155 220 Q150 245 162 245 Q168 200 150 95 Z" />
              {/* hips */}
              <path d="M55 200 Q100 220 145 200 L150 260 Q100 270 50 260 Z" />
              {/* legs */}
              <path d="M62 260 L70 400 L92 400 L98 270 Z" />
              <path d="M138 260 L130 400 L108 400 L102 270 Z" />
            </g>

            {/* hotspots */}
            {HOTSPOTS.map(({ area, cx, cy, r }) => {
              const intensity = map[area];
              return (
                <g key={area} onClick={() => cycle(area)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={colorFor(intensity)}
                    fillOpacity={intensity ? 0.85 : 0.35}
                    stroke="var(--color-foreground)"
                    strokeOpacity={intensity ? 0.4 : 0.15}
                    strokeWidth="1.5"
                  />
                  <circle cx={cx} cy={cy} r={r + 8} fill="transparent" />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {HOTSPOTS.map(({ area }) => {
            const i = map[area];
            return (
              <button
                key={area}
                onClick={() => cycle(area)}
                className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13.5px] active:scale-[0.98]"
                style={{
                  borderColor: i ? "transparent" : "var(--color-border)",
                  background: i ? colorFor(i) : "var(--color-card)",
                  color: i === "severe" ? "var(--color-primary-foreground)" : "var(--color-foreground)",
                }}
              >
                <span className="font-medium truncate">{LABEL_AREA[area]}</span>
                <span className="text-[11.5px] opacity-80 ml-2 shrink-0">
                  {i ? LABEL_INTENSITY[i] : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-[12px]" style={{ color: "var(--color-muted-foreground)" }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--color-pain-light)" }} /> Lieve
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--color-pain-moderate)" }} /> Moderato
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--color-pain-severe)" }} /> Forte
        </span>
      </div>
    </section>
  );
}
