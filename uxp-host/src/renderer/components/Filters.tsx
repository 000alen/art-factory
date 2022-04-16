import React from "react";

import { Button, Checkbox, Heading, SearchField, View } from "@adobe/react-spectrum";

import { Bundles } from "../typings";

type Filters = Record<string, string[]>;

interface FiltersProps {
  repeatedFilter: boolean;
  addRepeatedFilter: () => void;
  removeRepeatedFilter: () => void;
  onRegenerateRepeated: () => void;
  onRemoveRepeated: () => void;
  addStringFilter: (query: string) => void;
  removeStringFilter: () => void;
  bundlesFiltersInfo: string[];
  bundlesFilters: string[];
  addBundlesFilter: (bundle: string) => void;
  removeBundlesFilter: (bundle: string) => void;
  filtersInfo: Filters;
  hasFilter: (name: string, value: string) => boolean;
  addFilter: (name: string, value: string) => void;
  removeFilter: (name: string, value: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  addStringFilter,
  removeStringFilter,
  repeatedFilter,
  addRepeatedFilter,
  removeRepeatedFilter,
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
}) => {
  return (
    <View>
      <SearchField
        onSubmit={(query: string) => {
          if (query !== "") addStringFilter(query);
          else removeStringFilter();
        }}
      />

      <details className="space-x-2 space-y-2">
        <summary>
          <Heading UNSAFE_className="inline-block">Repeated</Heading>
        </summary>
        <Checkbox
          isSelected={repeatedFilter}
          onChange={(isSelected) => {
            if (isSelected) addRepeatedFilter();
            else removeRepeatedFilter();
          }}
        >
          Repeated
        </Checkbox>
        <Button variant="secondary" onPress={onRegenerateRepeated}>
          Regenerate
        </Button>
        <Button variant="secondary" onPress={onRemoveRepeated}>
          Remove
        </Button>
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
    </View>
  );
};
