import { useMemo } from "react";

import type { CageDimensions, CageLayout } from "~/features/rack-visualizer/types/domain";
import {
  buildDerivedCageLayout,
  getCagePlacementMetrics,
  validateCageLayout,
} from "~/features/rack-visualizer/utils/cage-layout";

interface UseRackLayoutOptions {
  baseLayout: Pick<CageLayout, "id" | "name">;
  dimensions: CageDimensions;
}

export function useRackLayout({ baseLayout, dimensions }: UseRackLayoutOptions) {
  return useMemo(() => {
    const cageLayout = buildDerivedCageLayout(baseLayout, dimensions);
    const metrics = getCagePlacementMetrics(dimensions);
    const validation = validateCageLayout(dimensions);

    return {
      cageLayout,
      metrics,
      validation,
    };
  }, [baseLayout, dimensions]);
}
