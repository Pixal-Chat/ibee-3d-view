# Rack Visualizer

Phase 2 complete internal datacenter rack visualizer for the Remix-based DC ops portal.

## Run

```bash
npm install
npm run dev
```

## Route

- `/ops/rack-visualizer`

## Mock API Replacement Points

- Real cage layout API: `app/features/rack-visualizer/api/mock-data.ts` via `getCageLayout()`
- Real inventory API: `app/features/rack-visualizer/api/mock-data.ts` via `getInventoryDefinitions()`
- Real rack detail API: `app/features/rack-visualizer/api/mock-data.ts` via `getRackById()` / `getAllRacks()`
- Route loader seam: `app/routes/ops.rack-visualizer.tsx`

## Phase 3 Hook Points

- Cage scene overlays and topology rendering: `app/features/rack-visualizer/components/CageScene.tsx`
- Rack selection behavior and URL-linked transitions: `app/features/rack-visualizer/components/RackVisualizerShell.tsx`
- Rack occupancy planning and validation helpers: `app/features/rack-visualizer/utils/slot-planning.ts`
- Rack detail editing surface for non-sequential workflows: `app/features/rack-visualizer/components/RackDetailView.tsx`
