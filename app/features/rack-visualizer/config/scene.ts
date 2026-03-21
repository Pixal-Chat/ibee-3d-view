export const SCENE_COLORS = {
  background: "#f8fafc",
  floor: "#ffffff",
  floorAccent: "#e2e8f0",
  boundary: "#cbd5e1",
  boundaryMuted: "#e2e8f0",
  boundarySoft: "#94a3b8",
  rack: "#9ca3af",
  rackHovered: "#f97316",
  rackSelected: "#ea580c",
  rackFill: "#e2e8f0",
  rackFillSelected: "#fed7aa",
  labelText: "#0f172a",
  panelText: "#0f172a",
  serverTint: "#e5e7eb",
  switchTint: "#ffedd5",
  storageTint: "#f5f5f4",
  success: "#166534",
  danger: "#b91c1c",
} as const;

export const SCENE_DIMENSIONS = {
  rackWidth: 0.5842,
  rackDepth: 1.1684,
  rackHeight: 1.9558,
  cageWallHeight: 0.22,
  rowSpacing: 1.5,
  floorMargin: 0.8,
  hoverLabelOffsetY: 1.55,
  hoverLift: 0.08,
  selectedLift: 0.05,
  focusOffsetX: 2.35,
  focusOffsetY: 1.55,
  focusOffsetZ: 3.9,
} as const;

export const SCENE_CAMERA = {
  position: [10.5, 8.25, 11.5] as const,
  target: [0, 0.75, 0] as const,
  fov: 38,
  minDistance: 6,
  maxDistance: 34,
  minPolarAngle: Math.PI / 5,
  maxPolarAngle: Math.PI / 2.08,
  zoom: 1,
} as const;

export const SCENE_TRANSITIONS = {
  focusInTime: 1.8,
  focusOutTime: 1.55,
  focusInZoomTime: 1.95,
  focusOutZoomTime: 1.45,
  rackFadeInTime: 0.28,
  rackFadeOutTime: 0.58,
} as const;

export const SCENE_LIGHTING = {
  ambient: 0.95,
  hemisphere: 0.45,
  directional: 0.8,
  fill: 0.16,
  contactOpacity: 0.08,
} as const;

export const RACK_DETAIL_CONFIG = {
  totalUnits: 42,
  unitRowHeight: 11,
  cabinetWidth: 236,
  cabinetPadding: 10,
  cabinetMinHeight: 500,
} as const;
