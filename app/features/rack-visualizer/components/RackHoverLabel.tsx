import { Html } from "@react-three/drei";

interface RackHoverLabelProps {
  label: string;
  position: [number, number, number];
}

export function RackHoverLabel({ label, position }: RackHoverLabelProps) {
  return (
    <Html position={position} center distanceFactor={10} occlude>
      <div className="pointer-events-none rounded-lg border border-orange-200 bg-white/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-md">
        {label}
      </div>
    </Html>
  );
}
