import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RACK_DETAIL_CONFIG } from "~/features/rack-visualizer/config/scene";
import type { RackConnection, RackUnitItem, ServerRole } from "~/features/rack-visualizer/types/domain";
import { formatEquipmentType } from "~/features/rack-visualizer/utils/formatting";
import { generateRackUnitGrid, getNextAvailableUnit } from "~/features/rack-visualizer/utils/slot-planning";

interface Rack2DDiagramProps {
  rackName: string;
  items: RackUnitItem[];
  totalUnits?: number;
  selectedItemId: string | null;
  addTargetUnit: number | null;
  connections: RackConnection[];
  onOpenAddPanel: (unit: number) => void;
  onSelectItem: (itemId: string | null) => void;
  onUpdateItem: (itemId: string, updates: Partial<RackUnitItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddConnection: (fromItemId: string, toItemId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
}

interface ActiveDrag {
  fromItemId: string;
  fromCenterY: number;
  color: string;
}

const CATEGORY_STYLES: Record<Exclude<RackUnitItem["category"], "placeholder">, string> = {
  servers: "bg-[#1f1f1f]",
  switches: "bg-[#1f1f1f]",
  storage: "bg-[#1f1f1f]",
};

const getBackgroundImage = (item: RackUnitItem) => {
  if (item.category === "servers") {
    return item.sizeU === 1
      ? "url('https://rack-planner.patchbox.com/img/cabinet/unit_bs.svg')"
      : "url('https://rack-planner.patchbox.com/img/cabinet/unit_bs2.svg')";
  }
  if (item.category === "switches") {
    return item.definitionId === "switches-48p"
      ? "url('https://rack-planner.patchbox.com/img/cabinet/unit_sw48.svg')"
      : "url('https://rack-planner.patchbox.com/img/cabinet/unit_sw24.svg')";
  }
  if (item.category === "storage") {
    return "url('https://rack-planner.patchbox.com/img/cabinet/unit_ds.svg')";
  }
  return undefined;
};

const UNIT_HEIGHT = 32;
// SVG overlay is inset-[5px] so it covers the content area (340px - 2×5px border = 330px wide)
const SVG_WIDTH = 330;
// Connections exit from the right edge of the rack content, travel outside, then return
const CONN_X = SVG_WIDTH;       // right edge of content (connection attach point)
const OUTSIDE_X = CONN_X + 20; // how far right the cable runs outside the rack
const CORNER_R = 8;             // rounded corner radius

// Builds an orthogonal connector path: horizontal out → rounded corner → vertical → rounded corner → horizontal back
function buildOrthoPath(fromY: number, toY: number, partial = false): string {
  const dy = toY - fromY;
  const r = CORNER_R;
  if (Math.abs(dy) < r * 2) {
    // Too close vertically for corners — straight horizontal stub
    return partial ? `M ${CONN_X} ${fromY} H ${OUTSIDE_X}` : `M ${CONN_X} ${fromY} H ${OUTSIDE_X} V ${toY} H ${CONN_X}`;
  }
  const sign = dy > 0 ? 1 : -1;
  const out = `M ${CONN_X} ${fromY} H ${OUTSIDE_X - r} Q ${OUTSIDE_X} ${fromY} ${OUTSIDE_X} ${fromY + sign * r}`;
  const vert = `V ${toY - sign * r}`;
  const back = `Q ${OUTSIDE_X} ${toY} ${OUTSIDE_X - r} ${toY} H ${CONN_X}`;
  return partial ? `${out} ${vert}` : `${out} ${vert} ${back}`;
}

function getItemCenterY(item: RackUnitItem, totalUnits: number): number {
  const topPx = (totalUnits - item.startUnit - item.sizeU + 1) * UNIT_HEIGHT;
  return topPx + (item.sizeU * UNIT_HEIGHT) / 2;
}

function getPortLimit(switchItem: RackUnitItem): number {
  return switchItem.definitionId.includes("48p") ? 48 : 24;
}

const ROLE_LABELS: Record<ServerRole, string> = {
  standard: "Standard",
  gateway: "Gateway",
  spine: "Spine",
};

export function Rack2DDiagram({
  rackName,
  items,
  totalUnits = RACK_DETAIL_CONFIG.totalUnits,
  selectedItemId,
  addTargetUnit,
  connections,
  onOpenAddPanel,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onAddConnection,
  onRemoveConnection,
}: Rack2DDiagramProps) {
  const itemStarts = useMemo(
    () => generateRackUnitGrid(items, totalUnits).filter((slot) => slot.isItemStart && slot.item),
    [items, totalUnits],
  );
  const nextAvailableUnit = useMemo(() => getNextAvailableUnit(items, totalUnits), [items, totalUnits]);

  // Refs for zero-latency drag (no React re-renders during mousemove)
  const rackBodyRef = useRef<HTMLDivElement>(null);
  const rubberLineRef = useRef<SVGPathElement>(null);
  const snapHighlightRef = useRef<SVGRectElement>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const connectionsRef = useRef(connections);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  // Minimal React state — only to trigger SVG line visibility
  const [isDragging, setIsDragging] = useState(false);
  const [dragColor, setDragColor] = useState("red");

  const handleDragStart = useCallback(
    (e: React.MouseEvent, item: RackUnitItem) => {
      e.preventDefault();
      e.stopPropagation();

      const rackBody = rackBodyRef.current;
      if (!rackBody) return;

      const fromCenterY = getItemCenterY(item, totalUnits);
      const color = item.category === "servers" ? "#ef4444" : "#3b82f6";

      activeDragRef.current = { fromItemId: item.id, fromCenterY, color };
      setDragColor(color);
      setIsDragging(true);

      // Precompute switch zones once (avoids per-frame recalc)
      const switchZones = items
        .filter((i) => i.category === "switches")
        .map((sw) => ({
          item: sw,
          centerY: getItemCenterY(sw, totalUnits),
          topPx: (totalUnits - sw.startUnit - sw.sizeU + 1) * UNIT_HEIGHT,
          heightPx: sw.sizeU * UNIT_HEIGHT,
        }));

      let currentSnapId: string | null = null;

      const onMouseMove = (ev: MouseEvent) => {
        const line = rubberLineRef.current;
        const snapRect = snapHighlightRef.current;
        if (!line || !snapRect || !rackBody) return;

        // Coordinates relative to SVG content area (inside 5px border)
        const rect = rackBody.getBoundingClientRect();
        const cursorX = ev.clientX - rect.left - 5;
        const cursorY = ev.clientY - rect.top - 5;

        // Snap detection: cursor Y within a switch's bounds ±10px
        const snapped =
          switchZones.find(
            (zone) => cursorY >= zone.topPx - 10 && cursorY <= zone.topPx + zone.heightPx + 10,
          ) ?? null;

        const newSnapId = snapped?.item.id ?? null;
        if (newSnapId !== currentSnapId) {
          currentSnapId = newSnapId;
          if (snapped) {
            snapRect.setAttribute("y", String(snapped.topPx));
            snapRect.setAttribute("height", String(snapped.heightPx));
            snapRect.style.display = "";
          } else {
            snapRect.style.display = "none";
          }
        }

        // Update path directly — bypasses React entirely for zero latency
        const endY = snapped ? snapped.centerY : cursorY;
        line.setAttribute("d", buildOrthoPath(activeDragRef.current!.fromCenterY, endY, !snapped));
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        if (currentSnapId && activeDragRef.current) {
          onAddConnection(activeDragRef.current.fromItemId, currentSnapId);
        }

        // Always hide the snap highlight on release
        if (snapHighlightRef.current) {
          snapHighlightRef.current.style.display = "none";
        }

        activeDragRef.current = null;
        setIsDragging(false);
        currentSnapId = null;
      };

      document.body.style.cursor = "crosshair";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [items, totalUnits, onAddConnection],
  );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-outline bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Rack Diagram</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{rackName}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-2.5 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Next slot</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{nextAvailableUnit ? `U${nextAvailableUnit}` : "Full"}</p>
          </div>
          {nextAvailableUnit !== null ? (
            <button
              type="button"
              onClick={() => onOpenAddPanel(addTargetUnit ?? nextAvailableUnit)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-primary shadow-sm transition hover:bg-orange-50 active:bg-orange-100"
              title={`Add utility at U${addTargetUnit ?? nextAvailableUnit}`}
              aria-label={`Add utility at U${addTargetUnit ?? nextAvailableUnit}`}
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M10 4.167v11.666M4.167 10h11.666"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="mt-4 flex flex-1 overflow-x-auto rounded-[18px] bg-slate-50 p-6 shadow-inner justify-center items-start min-h-[500px]"
        onClick={() => onSelectItem(null)}
      >
        {/* Container for Rack + Numbers */}
        <div className="relative flex gap-1 isolate" style={{ height: `${totalUnits * UNIT_HEIGHT}px` }}>

          {/* External Numbers Column */}
          <div className="relative w-8 shrink-0">
            {Array.from({ length: totalUnits }, (_, index) => {
              const unit = totalUnits - index;
              return (
                <div
                  key={unit}
                  className="absolute right-2 flex w-full items-center justify-end text-[12px] font-bold text-slate-400"
                  style={{
                    top: `${index * UNIT_HEIGHT}px`,
                    height: `${UNIT_HEIGHT}px`,
                  }}
                >
                  {unit}
                </div>
              );
            })}
          </div>

          {/* Rack Graphic Body */}
          <div
            ref={rackBodyRef}
            className="relative w-[340px] shrink-0 rounded-[2px] border-[5px] border-x-[#e5e7eb] border-y-[#cbd5e1] bg-white shadow-sm"
          >
            {/* Background Grid Slots */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-[2px]">
              {Array.from({ length: totalUnits }, (_, index) => {
                const unit = totalUnits - index;
                const isTarget = unit === addTargetUnit;
                return (
                  <div
                    key={index}
                    className={`w-full border-b border-slate-100 transition-colors duration-200 ${
                      isTarget ? "bg-amber-200/40" : ""
                    }`}
                    style={{ height: `${UNIT_HEIGHT}px` }}
                  />
                );
              })}
            </div>

            {/* Rack Items */}
            {itemStarts.map(({ item }) => {
              if (!item) return null;

              const topPx = (totalUnits - item.startUnit - item.sizeU + 1) * UNIT_HEIGHT;
              const heightPx = item.sizeU * UNIT_HEIGHT;
              const isSelected = selectedItemId === item.id;
              const isPlaceholder = item.category === "placeholder";
              const bgImage = getBackgroundImage(item);
              const isConnectable = item.category === "servers" || item.category === "storage";
              // Show popup above the item when near the bottom of the rack (low unit numbers)
              const showPopupAbove = item.startUnit <= 14;
              const popupPos = showPopupAbove
                ? "bottom-full mb-1 left-1/2 -translate-x-1/2"
                : "top-full mt-1 left-1/2 -translate-x-1/2";
              const itemConnections = connections.filter(
                (c) => c.fromItemId === item.id || c.toItemId === item.id,
              );

              return (
                <div
                  key={item.id}
                  className={`absolute z-10 group transition-shadow duration-200 ${
                    isPlaceholder
                      ? "border-[2px] border-dashed border-[#8c8c8c] bg-[#333333] text-[#efefef]"
                      : CATEGORY_STYLES[item.category as keyof typeof CATEGORY_STYLES]
                  } ${isSelected ? "ring-[2px] ring-primary z-30" : "hover:ring-2 hover:ring-slate-400 z-20"}`}
                  style={{
                    left: 0,
                    right: 0,
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                    backgroundImage: bgImage,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                  title={formatEquipmentType(item.type)}
                >
                  {/* Server role badge */}
                  {item.category === "servers" && item.serverRole && item.serverRole !== "standard" && (
                    <span
                      className="absolute top-1 left-1 z-40 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white pointer-events-none"
                      style={{ backgroundColor: item.serverRole === "gateway" ? "#f97316" : "#9333ea" }}
                    >
                      {item.serverRole === "gateway" ? "GW" : "SP"}
                    </span>
                  )}

                  {isPlaceholder ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item.id);
                      }}
                      className="flex h-full w-full items-center justify-center font-medium text-[13px] opacity-80 transition hover:opacity-100"
                    >
                      {item.placeholderText || "Click to enter placeholder text..."}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item.id);
                      }}
                      className="flex h-full w-full items-start p-2 opacity-0 hover:opacity-100 transition duration-200 bg-black/60 rounded-[2px]"
                    >
                      <span className="truncate font-semibold tracking-wide text-white text-[12px]">
                        {formatEquipmentType(item.type)}
                      </span>
                    </button>
                  )}

                  {/* Drag handle for connectable items */}
                  {isConnectable && !isPlaceholder && (
                    <div
                      title="Drag to connect to a switch"
                      className={`absolute right-0 top-0 bottom-0 z-40 flex w-5 cursor-crosshair items-center justify-center transition-opacity duration-150 ${
                        isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      onMouseDown={(e) => handleDragStart(e, item)}
                    >
                      <div
                        className="h-5 w-1.5 rounded-sm shadow-sm"
                        style={{ backgroundColor: item.category === "servers" ? "#ef4444" : "#3b82f6" }}
                      />
                    </div>
                  )}

                  {/* Placeholder selection popover */}
                  {isSelected && isPlaceholder ? (
                    <div
                      className={`absolute ${popupPos} w-[320px] rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 z-50 p-4 cursor-default`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-slate-900 text-[15px]">{item.type}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                          className="text-slate-400 hover:text-red-500 transition"
                        >
                          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                            <path d="M6.667 6.667l6.666 6.666M13.333 6.667l-6.666 6.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[12px] font-semibold text-slate-800">Type</label>
                          <select className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-[14px] text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={item.definitionId} disabled>
                            <option value={item.definitionId}>{item.type}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold text-slate-800">Placeholder text (max. 36 chars)</label>
                          <input
                            type="text"
                            maxLength={36}
                            value={item.placeholderText || ""}
                            onChange={(e) => onUpdateItem(item.id, { placeholderText: e.target.value })}
                            placeholder="e.g. Reserved for future growth"
                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Non-placeholder selection popover */}
                  {isSelected && !isPlaceholder ? (
                    <div
                      className={`absolute ${popupPos} w-[300px] rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 z-50 p-4 cursor-default`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-slate-900 text-[14px]">{item.label}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectItem(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition"
                        >
                          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                            <path d="M6.667 6.667l6.666 6.666M13.333 6.667l-6.666 6.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      {/* Server role selector */}
                      {item.category === "servers" && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Role</p>
                          <div className="flex gap-1.5">
                            {(["standard", "gateway", "spine"] as ServerRole[]).map((role) => {
                              const active = (item.serverRole ?? "standard") === role;
                              const activeColor =
                                role === "gateway" ? "bg-orange-500 text-white border-orange-500"
                                : role === "spine" ? "bg-purple-500 text-white border-purple-500"
                                : "bg-slate-800 text-white border-slate-800";
                              return (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateItem(item.id, { serverRole: role });
                                  }}
                                  className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold capitalize transition ${
                                    active ? activeColor : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  {ROLE_LABELS[role]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Switch port usage */}
                      {item.category === "switches" && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Port Usage</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${Math.min(100, (itemConnections.filter(c => c.toItemId === item.id).length / getPortLimit(item)) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[12px] font-semibold text-slate-700 tabular-nums">
                              {itemConnections.filter(c => c.toItemId === item.id).length} / {getPortLimit(item)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Connections list */}
                      {itemConnections.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                            Connections ({itemConnections.length})
                          </p>
                          <div className="space-y-1 max-h-[120px] overflow-y-auto">
                            {itemConnections.map((conn) => {
                              const partnerId = conn.fromItemId === item.id ? conn.toItemId : conn.fromItemId;
                              const partner = items.find((i) => i.id === partnerId);
                              return (
                                <div
                                  key={conn.id}
                                  className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5"
                                >
                                  <span className="text-[12px] text-slate-700 truncate">{partner?.label ?? partnerId}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveConnection(conn.id);
                                    }}
                                    className="ml-2 shrink-0 text-slate-400 hover:text-red-500 transition"
                                    aria-label="Remove connection"
                                  >
                                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                                      <path d="M6.667 6.667l6.666 6.666M13.333 6.667l-6.666 6.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Delete item */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(null);
                          onDeleteItem(item.id);
                        }}
                        className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Delete Item
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* SVG overlay: connection bezier curves + drag rubber-band line + snap highlight */}
            <svg
              className="absolute pointer-events-none z-20 overflow-visible"
              style={{
                top: 5,
                left: 5,
                width: SVG_WIDTH,
                height: totalUnits * UNIT_HEIGHT,
              }}
            >
              {/* Committed connections */}
              {connections.map((conn) => {
                const fromItem = items.find((i) => i.id === conn.fromItemId);
                const toItem = items.find((i) => i.id === conn.toItemId);
                if (!fromItem || !toItem) return null;

                const fromY = getItemCenterY(fromItem, totalUnits);
                const toY = getItemCenterY(toItem, totalUnits);
                const color = fromItem.category === "servers" ? "#ef4444" : "#3b82f6";

                return (
                  <path
                    key={conn.id}
                    d={buildOrthoPath(fromY, toY)}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.85"
                  />
                );
              })}

              {/* Snap highlight rect — hidden by default */}
              <rect
                ref={snapHighlightRef}
                x="0"
                y="0"
                width={SVG_WIDTH}
                height={UNIT_HEIGHT}
                fill="transparent"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                rx="2"
                style={{ display: "none" }}
              />

              {/* Rubber-band drag line — only rendered when dragging */}
              {isDragging && (
                <path
                  ref={rubberLineRef}
                  d={buildOrthoPath(activeDragRef.current?.fromCenterY ?? 0, activeDragRef.current?.fromCenterY ?? 0, true)}
                  stroke={dragColor}
                  strokeWidth="2.5"
                  strokeDasharray="6 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
