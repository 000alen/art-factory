import React, { useState } from "react";

import {
  Button,
  Flex,
  Grid,
  Heading,
  Item,
  NumberField,
  repeat,
  TabList,
  TabPanels,
  Tabs,
  View,
} from "@adobe/react-spectrum";

import { BundleItem } from "../pages/QualityPage";
import { Bundles, Collection } from "../typings";
import { GalleryBundles } from "./GalleryBundles";
import { GalleryItems } from "./GalleryItems";
import { ImageItem } from "./ImageItem";
import { PAGE_N } from "../constants";

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
}) => {
  const [selectedKey, setSelectedKey] = useState("items");

  return (
    <>
      <Flex
        zIndex={1001}
        position="sticky"
        top={0}
        gap="size-100"
        alignItems="center"
        justifyContent="space-between"
      >
        <Tabs
          isQuiet={true}
          selectedKey={selectedKey}
          onSelectionChange={(selectedKey) =>
            setSelectedKey(selectedKey as string)
          }
        >
          <TabList>
            <Item key="items">Items</Item>
            <Item key="bundles">Bundles</Item>
          </TabList>
        </Tabs>

        <Flex
          width="100%"
          gap="size-100"
          justifyContent="end"
          alignItems="center"
        >
          Page{" "}
          <NumberField
            aria-label="page"
            value={
              selectedKey === "items"
                ? page
                : selectedKey === "bundles"
                ? bundlesPage
                : 0
            }
            minValue={1}
            maxValue={
              selectedKey === "items"
                ? maxPage
                : selectedKey === "bundles"
                ? bundlesMaxPage
                : 0
            }
            onChange={(value: number) => {
              if (selectedKey === "items") {
                setCursor((value - 1) * PAGE_N);
                setPage(value);
              } else if (selectedKey === "bundles") {
                setBundlesCursor((value - 1) * PAGE_N);
                setBundlesPage(value);
              }
            }}
          />{" "}
          of{" "}
          {selectedKey === "items"
            ? maxPage
            : selectedKey === "bundles"
            ? bundlesMaxPage
            : 0}
        </Flex>
      </Flex>

      {selectedKey === "items" ? (
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
      ) : selectedKey === "bundles" ? (
        <GalleryBundles
          {...{
            bundlesItems,
            bundlesCursor,
          }}
        />
      ) : null}
    </>
  );
};
