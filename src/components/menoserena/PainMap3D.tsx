import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
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
  if (i === "light") return "#f5c97a";
  if (i === "moderate") return "#e89060";
  if (i === "severe") return "#c84a3a";
  return "#e8dccb";
};

// Hotspot positions in 3D space — front of body, simple humanoid proportions
type Hotspot = {
  area: PainArea;
  pos: [number, number, number];
  radius: number;
};

const HOTSPOTS: Hotspot[] = [
  { area: "neck", pos: [0, 1.55, 0.12], radius: 0.1 },
  { area: "shoulders", pos: [0, 1.38, 0.18], radius: 0.2 },
  { area: "chest", pos: [0, 1.13, 0.32], radius: 0.16 },
  { area: "wrists", pos: [-0.54, 0.52, 0.1], radius: 0.11 },
  { area: "lower_back", pos: [0, 0.72, -0.25], radius: 0.16 },
  { area: "knees", pos: [0, -0.5, 0.16], radius: 0.16 },
];

// Feminine torso silhouette via LatheGeometry — profile revolved around Y axis.
// Points go bottom→top: hips wider, waist narrower, bust wider, shoulders.
const TORSO_PROFILE: [number, number][] = [
  [0.02, 0.25], // crotch
  [0.22, 0.32], // upper thigh / pelvis floor
  [0.32, 0.45], // hips widest
  [0.30, 0.55], // upper hips
  [0.24, 0.68], // waist narrowing
  [0.21, 0.78], // waist (narrowest)
  [0.24, 0.90], // ribcage
  [0.30, 1.05], // under bust
  [0.34, 1.18], // bust line
  [0.32, 1.30], // upper chest
  [0.28, 1.40], // shoulders
  [0.18, 1.48], // base of neck
  [0.09, 1.55], // neck
  [0.085, 1.62], // upper neck
];

function FemaleTorso({ skin }: { skin: string }) {
  const points = useMemo(
    () => TORSO_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
    []
  );
  const geom = useMemo(() => new THREE.LatheGeometry(points, 48), [points]);
  return (
    <mesh geometry={geom} castShadow>
      <meshStandardMaterial color={skin} roughness={0.75} />
    </mesh>
  );
}

function Hair({ skin }: { skin: string }) {
  // Soft hair cap covering back of head + flowing down to shoulders
  const hairColor = "#3b2418";
  return (
    <group>
      {/* Back cap */}
      <mesh position={[0, 1.86, -0.02]}>
        <sphereGeometry
          args={[0.235, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.62]}
        />
        <meshStandardMaterial color={hairColor} roughness={0.85} />
      </mesh>
      {/* Side/back length down to shoulders */}
      <mesh position={[0, 1.65, -0.05]} scale={[1, 1.3, 0.7]}>
        <sphereGeometry
          args={[0.24, 32, 32, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.55]}
        />
        <meshStandardMaterial color={hairColor} roughness={0.85} />
      </mesh>
      {/* Front fringe hint */}
      <mesh position={[0, 1.97, 0.16]} rotation={[0.3, 0, 0]} scale={[1, 0.35, 0.5]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={hairColor} roughness={0.85} />
      </mesh>
      {/* tiny ear suggestion (skin tone) */}
      <mesh position={[-0.21, 1.86, 0.02]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0.21, 1.86, 0.02]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Body({
  map,
  onPick,
}: {
  map: Record<PainArea, Intensity>;
  onPick: (a: PainArea) => void;
}) {
  const skin = "#f0d9c4";
  return (
    <group position={[0, -0.4, 0]}>
      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow scale={[0.92, 1.05, 1]}>
        <sphereGeometry args={[0.21, 32, 32]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* Hair */}
      <Hair skin={skin} />

      {/* Feminine torso (hips → waist → bust → shoulders) */}
      <FemaleTorso skin={skin} />

      {/* Bust definition */}
      <mesh position={[-0.11, 1.13, 0.22]} scale={[1, 1, 0.85]}>
        <sphereGeometry args={[0.115, 24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.11, 1.13, 0.22]} scale={[1, 1, 0.85]}>
        <sphereGeometry args={[0.115, 24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {/* Collarbone hollow (subtle dark sphere) */}
      <mesh position={[0, 1.36, 0.24]} scale={[1.4, 0.25, 0.4]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          color="#d9bfa6"
          roughness={0.85}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Arms — slim, slight bend */}
      <mesh position={[-0.36, 1.18, 0]} rotation={[0, 0, 0.22]}>
        <capsuleGeometry args={[0.065, 0.4, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.36, 1.18, 0]} rotation={[0, 0, -0.22]}>
        <capsuleGeometry args={[0.065, 0.4, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {/* Forearms */}
      <mesh position={[-0.48, 0.78, 0.02]} rotation={[0, 0, 0.18]}>
        <capsuleGeometry args={[0.055, 0.38, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.48, 0.78, 0.02]} rotation={[0, 0, -0.18]}>
        <capsuleGeometry args={[0.055, 0.38, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.54, 0.52, 0.05]} scale={[0.9, 1.2, 0.5]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.54, 0.52, 0.05]} scale={[0.9, 1.2, 0.5]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>

      {/* Thighs — fuller */}
      <mesh position={[-0.13, 0.0, 0]}>
        <capsuleGeometry args={[0.135, 0.55, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.13, 0.0, 0]}>
        <capsuleGeometry args={[0.135, 0.55, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {/* Knees */}
      <mesh position={[-0.13, -0.5, 0.04]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0.13, -0.5, 0.04]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* Calves */}
      <mesh position={[-0.13, -0.95, 0]}>
        <capsuleGeometry args={[0.095, 0.6, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.13, -0.95, 0]}>
        <capsuleGeometry args={[0.095, 0.6, 12, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.13, -1.36, 0.06]} scale={[1, 0.6, 1.6]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.13, -1.36, 0.06]} scale={[1, 0.6, 1.6]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>

      {/* Hotspots */}
      {HOTSPOTS.map((h) => (
        <Hotspot3D key={h.area} hotspot={h} intensity={map[h.area]} onPick={onPick} />
      ))}
    </group>
  );
}

function Hotspot3D({
  hotspot,
  intensity,
  onPick,
}: {
  hotspot: Hotspot;
  intensity: Intensity;
  onPick: (a: PainArea) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const color = colorFor(intensity);
  const active = intensity !== null;

  useFrame((state) => {
    if (!ref.current || !active) return;
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 3) * 0.08;
    ref.current.scale.setScalar(s);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onPick(hotspot.area);
  };

  return (
    <group position={hotspot.pos}>
      <mesh
        ref={ref}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[hotspot.radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.55 : hover ? 0.3 : 0.1}
          transparent
          opacity={active ? 0.85 : hover ? 0.65 : 0.45}
          roughness={0.4}
        />
      </mesh>
      {(active || hover) && (
        <Html distanceFactor={6} center position={[0, hotspot.radius + 0.12, 0]}>
          <div
            style={{
              background: "rgba(30,20,15,0.85)",
              color: "white",
              padding: "3px 8px",
              borderRadius: 10,
              fontSize: 11,
              whiteSpace: "nowrap",
              fontFamily: "Nunito, sans-serif",
              pointerEvents: "none",
            }}
          >
            {LABEL_AREA[hotspot.area]}
            {intensity ? ` — ${LABEL_INTENSITY[intensity]}` : ""}
          </div>
        </Html>
      )}
    </group>
  );
}

export function PainMap3D({ map, onChange }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handlePick = (a: PainArea) => {
    const cur = map[a];
    const next = NEXT[String(cur)];
    onChange(a, next);
    if (next) toast(`${LABEL_AREA[a]} — ${LABEL_INTENSITY[next]}`);
    else toast(`${LABEL_AREA[a]} — rimosso`);
  };

  const activeCount = useMemo(
    () => Object.values(map).filter((v) => v !== null).length,
    [map]
  );

  return (
    <section className="ms-card">
      <header className="mb-3">
        <h2 className="text-xl">Dove fa male oggi?</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Ruota il modello con un dito, pizzica per zoomare. Tocca un punto per
          cambiare intensità (lieve → moderato → forte → off).
        </p>
      </header>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          height: 420,
          background:
            "radial-gradient(ellipse at center top, #f7ede0 0%, #e8dccb 70%, #d6c5ad 100%)",
          touchAction: "none",
        }}
      >
        {mounted && (
          <Canvas
            shadows
            camera={{ position: [0, 0.3, 3.6], fov: 40 }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[3, 4, 5]}
              intensity={1.1}
              castShadow
            />
            <directionalLight position={[-3, 2, -2]} intensity={0.4} />
            <Body map={map} onPick={handlePick} />
            <OrbitControls
              enablePan={false}
              minDistance={2}
              maxDistance={7}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI - Math.PI / 6}
              target={[0, 0.3, 0]}
            />
          </Canvas>
        )}
      </div>

      <div
        className="mt-3 flex items-center justify-center gap-4 text-[12px]"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: colorFor("light") }} /> Lieve
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: colorFor("moderate") }} /> Moderato
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: colorFor("severe") }} /> Forte
        </span>
      </div>

      {activeCount > 0 && (
        <p className="mt-2 text-center text-[12px]" style={{ color: "var(--color-muted-foreground)" }}>
          {activeCount} {activeCount === 1 ? "area segnalata" : "aree segnalate"} oggi
        </p>
      )}
    </section>
  );
}
