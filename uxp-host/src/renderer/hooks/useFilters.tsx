import { useState } from "react";

export type Filters = Record<string, string[]>;

export const useFilters = () => {
  const [filters, setFilters] = useState<Filters>({});

  const addFilter = (n: string, v: string) =>
    setFilters((p) =>
      n in p
        ? {
            ...p,
            [n]: [...p[n], v],
          }
        : {
            ...p,
            [n]: [v],
          }
    );

  const hasFilter = (n: string, v: string) =>
    n in filters && filters[n].includes(v);

  const removeFilter = (n: string, v: string) =>
    setFilters((p) =>
      n in p
        ? {
            ...p,
            [n]: p[n].filter((pv) => pv !== v),
          }
        : p
    );

  return { filters, setFilters, addFilter, hasFilter, removeFilter };
};

export const useBundlesFilters = () => {
  const [bundlesFilters, setBundlesFilters] = useState<string[]>([]);

  const addBundlesFilter = (b: string) => setBundlesFilters((p) => [...p, b]);

  const removeBundlesFilter = (b: string) =>
    setBundlesFilters((p) => p.filter((v) => v !== b));

  return {
    bundlesFilters,
    setBundlesFilters,
    addBundlesFilter,
    removeBundlesFilter,
  };
};
