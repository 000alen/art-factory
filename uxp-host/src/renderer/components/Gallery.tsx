import React, { useState } from "react";

import { Flex, Item, NumberField, TabList, Tabs } from "@adobe/react-spectrum";

import { BundleItem } from "../pages/QualityPage";
import { Bundles, Collection } from "../typings";
import { GalleryBundles } from "./GalleryBundles";
import { GalleryItems } from "./GalleryItems";
import { PAGE_N } from "../constants";

export type setter<T> = (value: T | ((p: T) => T)) => void;

interface Item {
  name: string;
  url: string;
}

interface GalleryProps {
  selectedCollectionItem: number;
  filteredCollection: Collection;
  collectionPage: number;
  collectionMaxPage: number;
  setCollectionCursor: setter<number>;
  setCollectionPage: setter<number>;
  collectionItems: Item[];
  collectionItemsToRemove: string[];
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
  selectedCollectionItem,
  filteredCollection,
  collectionPage,
  collectionMaxPage,
  setCollectionCursor,
  setCollectionPage,
  collectionItems,
  collectionItemsToRemove,
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
                ? collectionPage
                : selectedKey === "bundles"
                ? bundlesPage
                : 0
            }
            minValue={1}
            maxValue={
              selectedKey === "items"
                ? collectionMaxPage
                : selectedKey === "bundles"
                ? bundlesMaxPage
                : 0
            }
            onChange={(value: number) => {
              if (selectedKey === "items") {
                setCollectionCursor((value - 1) * PAGE_N);
                setCollectionPage(value);
              } else if (selectedKey === "bundles") {
                setBundlesCursor((value - 1) * PAGE_N);
                setBundlesPage(value);
              }
            }}
          />{" "}
          of{" "}
          {selectedKey === "items"
            ? collectionMaxPage
            : selectedKey === "bundles"
            ? bundlesMaxPage
            : 0}
        </Flex>
      </Flex>

      {selectedKey === "items" ? (
        <GalleryItems
          {...{
            selectedCollectionItem,
            filteredCollection,
            page: collectionPage,
            maxPage: collectionMaxPage,
            setCursor: setCollectionCursor,
            setPage: setCollectionPage,
            items: collectionItems,
            itemsToRemove: collectionItemsToRemove,
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
