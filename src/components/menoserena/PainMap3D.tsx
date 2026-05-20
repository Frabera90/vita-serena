import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import type { Intensity, PainArea } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  map: Record<PainArea, Intensity>;
  onChange: (area: PainArea, next: Intensity) => void;
}

const MODEL_URL = "/models/female.glb";
useGLTF.preload(MODEL_URL);

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

type Hotspot = {
  area: PainArea;
  // y/x/z as fractions of model height where 0 = feet, 1 = top of head
  pos: [number, number, number];
  radius: number;
};

// Pose: arms raised overhead. Hotspots in normalized model space.
// x: lateral (−left / +right), y: vertical fraction of body height (0 feet, 1 head crown),
// z: depth (+front / −back)
const HOTSPOTS: Hotspot[] = [
  { area: "neck", pos: [0, 0.86, 0.06], radius: 0.05 },
  { area: "shoulders", pos: [0, 0.82, 0.08], radius: 0.11 },
  { area: "chest", pos: [0, 0.74, 0.13], radius: 0.08 },
  { area: "wrists", pos: [-0.12, 1.05, 0.02], radius: 0.06 },
  { area: "lower_back", pos: [0, 0.55, -0.12], radius: 0.08 },
  { area: "knees", pos: [0, 0.28, 0.08], radius: 0.07 },
];

function FemaleModel() {
  const { scene } = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group };

  // Clone so we don't mutate the cached scene
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute bbox, drop the pedestal base, recolor as a soft skin material
  const { processed, height } = useMemo(() => {
    const root = cloned;
    const skinMat = new THREE.MeshStandardMaterial({
      color: "#f0d9c4",
      roughness: 0.7,
      metalness: 0.05,
    });

    // The base/pedestal is the flattest disc — detect by aspect ratio and remove
    const candidates: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) candidates.push(o as THREE.Mesh);
    });

    let baseMesh: THREE.Mesh | null = null;
    let maxFlatness = 0;
    for (const m of candidates) {
      m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox!;
      const sx = bb.max.x - bb.min.x;
      const sy = bb.max.y - bb.min.y;
      const sz = bb.max.z - bb.min.z;
      const horiz = Math.max(sx, sz);
      const flatness = horiz / Math.max(sy, 0.0001);
      if (flatness > 4 && flatness > maxFlatness) {
        maxFlatness = flatness;
        baseMesh = m;
      }
    }
    if (baseMesh) baseMesh.visible = false;

    // Apply skin material to remaining meshes, enable shadows
    candidates.forEach((m) => {
      if (m === baseMesh) return;
      m.material = skinMat;
      m.castShadow = true;
      m.receiveShadow = true;
    });

    // Compute body bbox (after hiding the base)
    const bbox = new THREE.Box3();
    candidates.forEach((m) => {
      if (m.visible) bbox.expandByObject(m);
    });
    const size = new THREE.Vector3();
    bbox.getSize(size);
    return { processed: root, height: size.y };
  }, [cloned]);

  // Scale so the body is ~2.6 units tall and feet sit at y=0
  const scale = 2.6 / Math.max(height, 0.001);

  return (
    <Center disableY top cacheKey="female-model">
      <primitive object={processed} scale={scale} />
    </Center>
  );
}

function Hotspot3D({
  hotspot,
  intensity,
  onPick,
  bodyHeight,
}: {
  hotspot: Hotspot;
  intensity: Intensity;
  onPick: (a: PainArea) => void;
  bodyHeight: number;
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

  const [fx, fy, fz] = hotspot.pos;
  const pos: [number, number, number] = [
    fx * bodyHeight,
    fy * bodyHeight,
    fz * bodyHeight,
  ];
  const r = hotspot.radius * bodyHeight;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onPick(hotspot.area);
  };

  return (
    <group position={pos}>
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
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.6 : hover ? 0.35 : 0.15}
          transparent
          opacity={active ? 0.85 : hover ? 0.7 : 0.5}
          roughness={0.4}
        />
      </mesh>
      {(active || hover) && (
        <Html distanceFactor={6} center position={[0, r + 0.12, 0]}>
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

function Scene({
  map,
  onPick,
}: {
  map: Record<PainArea, Intensity>;
  onPick: (a: PainArea) => void;
}) {
  // Body is scaled to ~2.6 tall and centered with feet at y=0 by <Center top>
  const BODY_HEIGHT = 2.6;
  return (
    <>
      <FemaleModel />
      {HOTSPOTS.map((h) => (
        <Hotspot3D
          key={h.area}
          hotspot={h}
          intensity={map[h.area]}
          onPick={onPick}
          bodyHeight={BODY_HEIGHT}
        />
      ))}
    </>
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
          height: 460,
          background:
            "radial-gradient(ellipse at center top, #f7ede0 0%, #e8dccb 70%, #d6c5ad 100%)",
          touchAction: "none",
        }}
      >
        {mounted && (
          <Canvas
            shadows
            camera={{ position: [0, 1.4, 4.2], fov: 38 }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 4, 5]} intensity={1.1} castShadow />
            <directionalLight position={[-3, 2, -2]} intensity={0.45} />
            <hemisphereLight args={["#fff5e8", "#c9b59a", 0.4]} />
            <Scene map={map} onPick={handlePick} />
            <OrbitControls
              enablePan={false}
              minDistance={2}
              maxDistance={8}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI - Math.PI / 6}
              target={[0, 1.3, 0]}
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
