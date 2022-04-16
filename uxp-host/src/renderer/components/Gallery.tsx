import React from "react";

import {
    Button, Flex, Grid, Heading, Item, NumberField, repeat, TabList, TabPanels, Tabs, View
} from "@adobe/react-spectrum";

import { BundleItem } from "../pages/QualityPage";
import { Bundles, Collection } from "../typings";
import { GalleryBundles } from "./GalleryBundles";
import { GalleryItems } from "./GalleryItems";
import { ImageItem } from "./ImageItem";

export type setter<T> = (value: T | ((p: T) => T)) => void;

interface Item {
  name: string;
  url: string;
}

interface GalleryProps {
  filteredCollection: Collection;
  page: number;
  maxPage: number;
  setCursor: setter<number>;
  setPage: setter<number>;
  items: Item[];
  itemsToRemove: string[];
  onUndoRemove: (name: string) => void;
  onEdit: (i: number) => void;
  onRemove: (name: string) => void;
  onSelect: (i: number) => void;
  onRegenerate: (i: number) => void;
  filteredBundles: Bundles;
  bundlesPage: number;
  bundlesMaxPage: number;
  setBundlesCursor: setter<number>;
  setBundlesPage: setter<number>;
  bundlesItems: BundleItem[];
  bundlesFilters: string[];
  bundlesCursor: number;
}

export const Gallery: React.FC<GalleryProps> = ({
  filteredCollection,
  page,
  maxPage,
  setCursor,
  setPage,
  items,
  itemsToRemove,
  onUndoRemove,
  onEdit,
  onRemove,
  onSelect,
  onRegenerate,
  filteredBundles,
  bundlesPage,
  bundlesMaxPage,
  setBundlesCursor,
  setBundlesPage,
  bundlesItems,
  bundlesFilters,
  bundlesCursor,
}) => (
  <Tabs>
    <TabList>
      <Item key="items">Items</Item>
      <Item key="bundles">Bundles</Item>
    </TabList>
    <TabPanels>
      <Item key="items">
        <GalleryItems
          {...{
            filteredCollection,
            page,
            maxPage,
            setCursor,
            setPage,
            items,
            itemsToRemove,
            onUndoRemove,
            onEdit,
            onRemove,
            onSelect,
            onRegenerate,
          }}
        />
      </Item>

      <Item key="bundles">
        <GalleryBundles
          {...{
            filteredBundles,
            bundlesPage,
            bundlesMaxPage,
            setBundlesCursor,
            setBundlesPage,
            bundlesItems,
            bundlesFilters,
            bundlesCursor,
          }}
        />
      </Item>
    </TabPanels>
  </Tabs>
);