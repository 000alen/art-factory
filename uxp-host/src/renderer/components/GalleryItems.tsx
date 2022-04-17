import React from "react";

import {
  Button,
  Flex,
  Grid,
  Item,
  NumberField,
  repeat,
  TabList,
  Tabs,
  Text,
  View,
} from "@adobe/react-spectrum";

import { PAGE_N } from "../constants";
import { Collection } from "../typings";
import { setter } from "./Gallery";
import { ImageItem } from "./ImageItem";

interface Item {
  name: string;
  url: string;
}

interface GalleryItemsProps {
  items: Item[];
  itemsToRemove: string[];
  onUndoRemove: (name: string) => void;
  onEdit: (i: number) => void;
  onRemove: (name: string) => void;
  onSelect: (i: number) => void;
  onRegenerate: (i: number) => void;
}

export const GalleryItems: React.FC<GalleryItemsProps> = ({
  items,
  itemsToRemove,
  onUndoRemove,
  onEdit,
  onRemove,
  onSelect,
  onRegenerate,
}) => {
  return (
    <Grid
      columns={repeat("auto-fit", "175px")}
      gap="size-100"
      justifyContent="center"
    >
      {items.map(({ name, url }, i) =>
        itemsToRemove.includes(name) ? (
          <div
            key={i}
            className="w-full min-h-[175px] m-auto rounded border-2 border-dashed border-white flex justify-center items-center"
          >
            <Button variant="secondary" onPress={() => onUndoRemove(name)}>
              Undo
            </Button>
          </div>
        ) : (
          <ImageItem
            key={i}
            name={name}
            src={url}
            maxSize={175}
            actions={[
              {
                label: "Edit",
                onClick: () => onEdit(i),
              },
              {
                label: "Remove",
                onClick: () => onRemove(name),
              },
              {
                label: "Select",
                onClick: () => onSelect(i),
              },
              {
                label: "Regenerate",
                onClick: () => onRegenerate(i),
              },
            ]}
          />
        )
      )}
    </Grid>
  );
};
