import React, { useCallback, useState } from "react";
import { useEvent } from "react-use";

import { ActionGroup, Button, Grid, Item, repeat } from "@adobe/react-spectrum";
import Close from "@spectrum-icons/workflow/Close";
import Edit from "@spectrum-icons/workflow/Edit";
import Refresh from "@spectrum-icons/workflow/Refresh";

import { Preview } from "./Preview";
import { QualityItem } from "../pages/QualityPage";

interface GalleryItemsProps {
  selectedItem: string;
  items: QualityItem[];
  itemsToRemove: string[];
  onRemove: (name: string) => void;
  onUndoRemove: (name: string) => void;
  onEdit: (n: string) => void;
  onSelect: (n: string) => void;
  onRegenerate: (n: string) => void;
}

export const GalleryItems: React.FC<GalleryItemsProps> = ({
  selectedItem,
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

      const index = items.findIndex((i) => i.name === selectedItem);

      if (e.key === "ArrowLeft" || e.keyCode === 37) {
        const newIndex = Math.max(index - 1, 0);
        onSelect(items[newIndex].name);
      } else if (e.key === "ArrowRight" || e.keyCode === 39) {
        const newIndex = Math.min(index + 1, items.length - 1);
        onSelect(items[newIndex].name);
      }
    },
    [selectedItem, items, itemsToRemove, zoomed]
  );

  useEvent("keydown", handleKeyDown, document);

  const onAction = (message: string) => {
    const [action, name] = message.split("_");

    switch (action) {
      case "select":
        onSelect(name);
        break;
      case "remove":
        onRemove(name);
        break;
      case "regenerate":
        onRegenerate(name);
        break;
    }
  };

  return (
    <Grid
      columns={repeat("auto-fit", "220px")}
      gap="size-100"
      justifyContent="center"
    >
      {items.map(({ name, url }, i) => (
        <Preview
          key={i}
          name={name}
          url={url}
          controlledZoom={true}
          isZoomed={zoomed && selectedItem === name}
          onZoomChange={(isZoomed) => {
            if (isZoomed) {
              onSelect(name);
              setZoomed(true);
              return;
            }
            setZoomed(false);
          }}
          disabled={itemsToRemove.includes(name)}
          showOnDisabled={
            <Button variant="secondary" onPress={() => onUndoRemove(name)}>
              Undo
            </Button>
          }
        >
          <ActionGroup onAction={onAction} isJustified>
            <Item key={`select_${name}`}>
              <Edit />
            </Item>
            <Item key={`remove_${name}`}>
              <Close />
            </Item>
            <Item key={`regenerate_${name}`}>
              <Refresh />
            </Item>
          </ActionGroup>
        </Preview>
      ))}
    </Grid>
  );
};
