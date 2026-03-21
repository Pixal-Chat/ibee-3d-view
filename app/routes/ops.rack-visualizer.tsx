import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import {
  getAllRacks,
  getCageLayout,
  getInventoryDefinitions,
} from "~/features/rack-visualizer/api/mock-data";
import { RackVisualizerWorkspace } from "~/features/rack-visualizer/components/RackVisualizerWorkspace";

export async function loader(_: LoaderFunctionArgs) {
  const [cageLayout, inventoryDefinitions, racks] = await Promise.all([
    getCageLayout(),
    getInventoryDefinitions(),
    getAllRacks(),
  ]);

  return json({
    cageLayout,
    inventoryDefinitions,
    racks,
  });
}

export default function RackVisualizerRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <main className="app-shell min-h-screen">
      <RackVisualizerWorkspace
        cageLayout={data.cageLayout}
        racks={data.racks}
        inventoryDefinitions={data.inventoryDefinitions}
      />
    </main>
  );
}
