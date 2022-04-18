import React, { useCallback, useState } from "react";

import {
  ActionGroup,
  Button,
  Flex,
  Grid,
  Heading,
  Item,
  repeat,
  Text,
} from "@adobe/react-spectrum";
import { useEvent } from "react-use";

import { ImageItem } from "./ImageItem";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import Close from "@spectrum-icons/workflow/Close";
import Edit from "@spectrum-icons/workflow/Edit";
import Refresh from "@spectrum-icons/workflow/Refresh";

interface Item {
  name: string;
  url: string;
}

interface GalleryItemsProps {
  selectedItem: number;
  items: Item[];
  itemsToRemove: string[];
  onRemove: (name: string) => void;
  onUndoRemove: (name: string) => void;
  onEdit: (i: number) => void;
  onSelect: (i: number) => void;
  onRegenerate: (i: number) => void;
}

export const GalleryItems: React.FC<GalleryItemsProps> = ({
  selectedItem: selectedCollectionItem,
  items,
  itemsToRemove,
  onUndoRemove,
  onEdit,
  onRemove,
  onSelect,
  onRegenerate,
}) => {
  const [zoomed, setZoomed] = useState(false);

  const handleKeyDown = useCallback(
    (e) => {
      if (!zoomed) return;

      if (e.key === "ArrowLeft" || e.keyCode === 37)
        onSelect(Math.max(selectedCollectionItem - 1, 0));
      else if (e.key === "ArrowRight" || e.keyCode === 39)
        onSelect(Math.min(selectedCollectionItem + 1, items.length - 1));
    },
    [selectedCollectionItem, items, itemsToRemove, zoomed]
  );

  useEvent("keydown", handleKeyDown, document);

  const onAction = (message: string) => {
    const [action, _i] = message.split("_");
    const i = parseInt(_i, 10);

    switch (action) {
      case "select":
        onSelect(i);
        break;
      case "remove":
        onRemove(items[i].name);
        break;
      case "regenerate":
        onRegenerate(i);
        break;
    }
  };

  return (
    <Grid
      columns={repeat("auto-fit", "220px")}
      gap="size-100"
      justifyContent="center"
    >
      {items.map(({ name, url }, i) =>
        itemsToRemove.includes(name) ? (
          <div
            key={i}
            className="w-full min-h-[192px] m-auto rounded border-2 border-dashed border-white flex justify-center items-center"
          >
            <Button variant="secondary" onPress={() => onUndoRemove(name)}>
              Undo
            </Button>
          </div>
        ) : (
          <div
            key={i}
            className="relative w-48 p-3 border-1 border-solid border-white rounded"
          >
            <Flex direction="column" gap="size-100">
              {url ? (
                <ControlledZoom
                  isZoomed={zoomed && selectedCollectionItem === i}
                  onZoomChange={(isZoomed) => {
                    if (isZoomed) {
                      onSelect(i);
                      setZoomed(true);
                      return;
                    }
                    setZoomed(false);
                  }}
                  overlayBgColorEnd="rgba(30, 30, 30, 0.5)"
                >
                  <ImageItem src={url} maxSize={192} />
                </ControlledZoom>
              ) : (
                <div className="w-48 h-48 flex justify-center items-center">
                  <Text>Nothing to see here</Text>
                </div>
              )}
              <Heading>{name}</Heading>
              <ActionGroup onAction={onAction} isJustified>
                <Item key={`select_${i}`}>
                  <Edit />
                </Item>
                <Item key={`remove_${i}`}>
                  <Close />
                </Item>
                <Item key={`regenerate_${i}`}>
                  <Refresh />
                </Item>
              </ActionGroup>
            </Flex>
          </div>
        )
      )}
    </Grid>
  );
};
