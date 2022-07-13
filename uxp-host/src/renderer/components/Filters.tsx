import React from "react";

import { Button, Checkbox, Heading, SearchField } from "@adobe/react-spectrum";

type Filters = Record<string, string[]>;

interface FiltersProps {
  setStringFilter: (v: string) => void;
  repeatedFilter: boolean;
  setRepeatedFilter: (v: boolean) => void;
  onRegenerateRepeated: () => void;
  onRemoveRepeated: () => void;
  bundlesFiltersInfo: string[];
  bundlesFilters: string[];
  addBundlesFilter: (bundle: string) => void;
  removeBundlesFilter: (bundle: string) => void;
  filtersInfo: Filters;
  hasFilter: (name: string, value: string) => boolean;
  addFilter: (name: string, value: string) => void;
  removeFilter: (name: string, value: string) => void;
  dropsFiltersInfo: string[];
  dropsFilters: string[];
  addDropsFilter: (drop: string) => void;
  removeDropsFilter: (drop: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  setStringFilter,
  repeatedFilter,
  setRepeatedFilter,
  onRegenerateRepeated,
  onRemoveRepeated,
  bundlesFiltersInfo,
  bundlesFilters,
  addBundlesFilter,
  removeBundlesFilter,
  filtersInfo,
  hasFilter,
  addFilter,
  removeFilter,
  dropsFiltersInfo,
  dropsFilters,
  addDropsFilter,
  removeDropsFilter,
}) => {
  return (
    <>
      <SearchField
        zIndex={1001}
        position="sticky"
        top={0}
        onSubmit={setStringFilter}
      />

      <details className="space-x-2 space-y-2">
        <summary>
          <Heading UNSAFE_className="inline-block">Repeated</Heading>
        </summary>
        <Checkbox isSelected={repeatedFilter} onChange={setRepeatedFilter}>
          Repeated
        </Checkbox>
        <Button variant="secondary" onPress={onRegenerateRepeated}>
          Regenerate
        </Button>
        <Button variant="secondary" onPress={onRemoveRepeated}>
          Remove
        </Button>
      </details>

      <details className="space-x-2 space-y-2">
        <summary>
          <Heading UNSAFE_className="inline-block">Drops</Heading>
        </summary>
        {dropsFiltersInfo.map((drop, i) => (
          <Checkbox
            key={i}
            isSelected={dropsFilters.includes(drop)}
            onChange={(isSelected) => {
              if (isSelected) addDropsFilter(drop);
              else removeDropsFilter(drop);
            }}
          >
            {drop}
          </Checkbox>
        ))}
      </details>

      <details>
        <summary>
          <Heading UNSAFE_className="inline-block">Bundles</Heading>
        </summary>
        <div className="ml-2 flex flex-col">
          {bundlesFiltersInfo.map((bundle, i) => (
            <Checkbox
              key={i}
              isSelected={bundlesFilters.includes(bundle)}
              onChange={(isSelected) => {
                if (isSelected) addBundlesFilter(bundle);
                else removeBundlesFilter(bundle);
              }}
            >
              {bundle}
            </Checkbox>
          ))}
        </div>
      </details>

      {Object.entries(filtersInfo).map(([name, values], i) => (
        <details key={i}>
          <summary>
            <Heading UNSAFE_className="inline-block">{name}</Heading>
          </summary>
          <div className="ml-2 flex flex-col">
            {values.map((value, j) => (
              <Checkbox
                key={j}
                value={value}
                isSelected={hasFilter(name, value)}
                onChange={(isSelected) => {
                  if (isSelected) addFilter(name, value);
                  else removeFilter(name, value);
                }}
              >
                {value}
              </Checkbox>
            ))}
          </div>
        </details>
      ))}
    </>
  );
};
