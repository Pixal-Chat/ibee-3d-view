export type InventoryCategory = "servers" | "switches" | "storage" | "placeholder";

export type InventoryUnitType = 1 | 2 | 4;

export type ServerRole = "standard" | "gateway" | "spine";

export interface CageDimensions {
  cageLength: number;
  cageWidth: number;
  cagePadding: number;
  numberOfRows: number;
  racksPerRow: number;
}

export interface InventoryItemDefinition {
  id: string;
  key: string;
  category: InventoryCategory;
  label: string;
  unitSize: InventoryUnitType;
  powerW: number;
}

export interface RackUnitItem {
  id: string;
  rackId: string;
  definitionId: string;
  type: string;
  label: string;
  category: InventoryCategory;
  sizeU: InventoryUnitType;
  startUnit: number;
  powerW: number;
  placeholderText?: string;
  serverRole?: ServerRole;
}

export interface RackConnection {
  id: string;
  rackId: string;
  fromItemId: string;
  toItemId: string;
}

export interface Rack {
  id: string;
  name: string;
  totalUnits: 42;
  row: number;
  column: number;
  items: RackUnitItem[];
}

export interface RackPlacement {
  rackId: string;
  rackName: string;
  row: number;
  column: number;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  facing: "north" | "south";
}

export interface CageLayout {
  id: string;
  name: string;
  cageLength: CageDimensions["cageLength"];
  cageWidth: CageDimensions["cageWidth"];
  cagePadding: CageDimensions["cagePadding"];
  numberOfRows: CageDimensions["numberOfRows"];
  racksPerRow: CageDimensions["racksPerRow"];
  racks: RackPlacement[];
}
