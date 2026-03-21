import { create } from "zustand";

import type {
  CageDimensions,
  CageLayout,
  InventoryItemDefinition,
  Rack,
  RackConnection,
  RackUnitItem,
} from "~/features/rack-visualizer/types/domain";
import { generateRackPlacements } from "~/features/rack-visualizer/utils/cage-layout";

interface RackVisualizerState {
  selectedRackId: string | null;
  sceneViewMode: "overview" | "focused";
  cameraResetVersion: number;
  currentlyOpenAddFormRackId: string | null;
  currentlyOpenAddFormUnit: number | null;
  cageDimensions: CageDimensions;
  rackNames: Record<string, string>;
  rackUnitPlacements: Record<string, RackUnitItem[]>;
  rackConnections: Record<string, RackConnection[]>;
  setCageDimensions: (dimensions: Partial<CageDimensions>) => void;
  selectRack: (rackId: string | null) => void;
  triggerCameraReset: () => void;
  openAddForm: (rackId: string, unit: number) => void;
  closeAddForm: () => void;
  setRackName: (rackId: string, name: string) => void;
  setRackItems: (rackId: string, items: RackUnitItem[]) => void;
  addRackItem: (
    rackId: string,
    startUnit: number,
    definition: InventoryItemDefinition,
    label?: string,
  ) => void;
  removeRackItem: (rackId: string, itemId: string) => void;
  updateRackItem: (rackId: string, itemId: string, updates: Partial<RackUnitItem>) => void;
  addConnection: (rackId: string, fromItemId: string, toItemId: string) => void;
  removeConnection: (rackId: string, connectionId: string) => void;
  hydrateInitialData: (layout: CageLayout, racks: Rack[]) => void;
}

export const useRackVisualizerStore = create<RackVisualizerState>((set) => ({
  selectedRackId: null,
  sceneViewMode: "overview",
  cameraResetVersion: 0,
  currentlyOpenAddFormRackId: null,
  currentlyOpenAddFormUnit: null,
  cageDimensions: {
    cageLength: 8.6,
    cageWidth: 5.3,
    cagePadding: 0.91,
    numberOfRows: 2,
    racksPerRow: 10,
  },
  rackNames: {},
  rackUnitPlacements: {},
  rackConnections: {},
  setCageDimensions: (dimensions) =>
    set((state) => ({
      cageDimensions: {
        ...state.cageDimensions,
        ...dimensions,
      },
    })),
  selectRack: (rackId) =>
    set({
      selectedRackId: rackId,
      sceneViewMode: rackId ? "focused" : "overview",
      currentlyOpenAddFormRackId: rackId ? null : null,
      currentlyOpenAddFormUnit: null,
    }),
  triggerCameraReset: () =>
    set((state) => ({
      cameraResetVersion: state.cameraResetVersion + 1,
      selectedRackId: null,
      sceneViewMode: "overview",
      currentlyOpenAddFormRackId: null,
      currentlyOpenAddFormUnit: null,
    })),
  openAddForm: (rackId, unit) =>
    set({
      currentlyOpenAddFormRackId: rackId,
      currentlyOpenAddFormUnit: unit,
    }),
  closeAddForm: () =>
    set({
      currentlyOpenAddFormRackId: null,
      currentlyOpenAddFormUnit: null,
    }),
  setRackName: (rackId, name) =>
    set((state) => ({
      rackNames: {
        ...state.rackNames,
        [rackId]: name,
      },
    })),
  setRackItems: (rackId, items) =>
    set((state) => ({
      rackUnitPlacements: {
        ...state.rackUnitPlacements,
        [rackId]: [...items].sort((left, right) => left.startUnit - right.startUnit),
      },
    })),
  addRackItem: (rackId, startUnit, definition, label) =>
    set((state) => {
      const existingItems = state.rackUnitPlacements[rackId] ?? [];
      const nextItem: RackUnitItem = {
        id: `${rackId}-${definition.id}-${startUnit}`,
        rackId,
        definitionId: definition.id,
        type: definition.label,
        label: label ?? definition.label,
        category: definition.category,
        sizeU: definition.unitSize,
        startUnit,
        powerW: definition.powerW,
      };

      return {
        rackUnitPlacements: {
          ...state.rackUnitPlacements,
          [rackId]: [...existingItems, nextItem].sort((left, right) => left.startUnit - right.startUnit),
        },
        currentlyOpenAddFormRackId: null,
        currentlyOpenAddFormUnit: null,
      };
    }),
  removeRackItem: (rackId, itemId) =>
    set((state) => ({
      rackUnitPlacements: {
        ...state.rackUnitPlacements,
        [rackId]: (state.rackUnitPlacements[rackId] ?? []).filter((item) => item.id !== itemId),
      },
      rackConnections: {
        ...state.rackConnections,
        [rackId]: (state.rackConnections[rackId] ?? []).filter(
          (c) => c.fromItemId !== itemId && c.toItemId !== itemId,
        ),
      },
    })),
  updateRackItem: (rackId, itemId, updates) =>
    set((state) => ({
      rackUnitPlacements: {
        ...state.rackUnitPlacements,
        [rackId]: (state.rackUnitPlacements[rackId] ?? []).map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      },
    })),
  addConnection: (rackId, fromItemId, toItemId) =>
    set((state) => {
      const items = state.rackUnitPlacements[rackId] ?? [];
      const switchItem = items.find((i) => i.id === toItemId);
      if (!switchItem) return state;

      const portLimit = switchItem.definitionId.includes("48p") ? 48 : 24;
      const existing = state.rackConnections[rackId] ?? [];
      const isDuplicate = existing.some(
        (c) => c.fromItemId === fromItemId && c.toItemId === toItemId,
      );
      const switchUsage = existing.filter((c) => c.toItemId === toItemId).length;
      if (isDuplicate || switchUsage >= portLimit) return state;

      const newConn: RackConnection = {
        id: `conn-${fromItemId}-${toItemId}`,
        rackId,
        fromItemId,
        toItemId,
      };
      return {
        rackConnections: {
          ...state.rackConnections,
          [rackId]: [...existing, newConn],
        },
      };
    }),
  removeConnection: (rackId, connectionId) =>
    set((state) => ({
      rackConnections: {
        ...state.rackConnections,
        [rackId]: (state.rackConnections[rackId] ?? []).filter((c) => c.id !== connectionId),
      },
    })),
  hydrateInitialData: (layout, racks) =>
    set({
      cageDimensions: {
        cageLength: layout.cageLength,
        cageWidth: layout.cageWidth,
        cagePadding: layout.cagePadding,
        numberOfRows: layout.numberOfRows,
        racksPerRow: layout.racksPerRow,
      },
      selectedRackId: null,
      sceneViewMode: "overview",
      currentlyOpenAddFormRackId: null,
      currentlyOpenAddFormUnit: null,
      rackNames: Object.fromEntries(racks.map((rack) => [rack.id, rack.name])),
      rackUnitPlacements: Object.fromEntries(racks.map((rack) => [rack.id, rack.items])),
      rackConnections: {},
    }),
}));
