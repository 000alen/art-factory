import {
  Button,
  Flex,
  Grid,
  NumberField,
  repeat,
  View,
} from "@adobe/react-spectrum";
import React from "react";
import { PAGE_N } from "../pages/QualityPage";
import { Collection } from "../typings";
import { setter } from "./Gallery";
import { ImageItem } from "./ImageItem";

interface Item {
  name: string;
  url: string;
}

interface GalleryItemsProps {
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
}

export const GalleryItems: React.FC<GalleryItemsProps> = ({
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
}) => {
  return (
    <>
      <Flex
        width="100%"
        gap="size-100"
        alignItems="center"
        justifyContent="space-between"
        marginBottom={8}
      >
        <div>{filteredCollection.length} elements</div>

        <div>
          Page{" "}
          <NumberField
            aria-label="page"
            value={page}
            minValue={1}
            maxValue={maxPage}
            onChange={(value: number) => {
              setCursor((value - 1) * PAGE_N);
              setPage(value);
            }}
          />{" "}
          of {maxPage}
        </div>
      </Flex>

      <View maxHeight="85vh" overflow="auto">
        <Grid
          columns={repeat("auto-fit", "175px")}
          gap="size-100"
          justifyContent="center"
        >
          {items.map(({ name, url }, i) =>
            itemsToRemove.includes(name) ? (
              <div className="w-full min-h-[175px] m-auto rounded border-2 border-dashed border-white flex justify-center items-center">
                <Button variant="secondary" onPress={() => onUndoRemove(name)}>
                  Undo
                </Button>
              </div>
            ) : (
              <ImageItem
                name={name}
                src={url}
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
      </View>
    </>
  );
};
