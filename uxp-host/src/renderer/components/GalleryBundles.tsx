import React from "react";

import {
  ActionGroup,
  Button,
  Grid,
  Heading,
  Item,
  repeat,
  View,
} from "@adobe/react-spectrum";

import { BundleItem } from "../pages/QualityPage";
import { ImageItem } from "./ImageItem";
import { Preview } from "./Preview";
import Close from "@spectrum-icons/workflow/Close";
import Edit from "@spectrum-icons/workflow/Edit";
import Refresh from "@spectrum-icons/workflow/Refresh";

interface GalleryBundlesProps {
  bundlesItems: BundleItem[];
  itemsToRemove: string[];
  onSelect: (n: string) => void;
  onRemove: (name: string) => void;
  onUndoRemove: (name: string) => void;
  onRegenerate: (n: string) => void;
}

export const GalleryBundles: React.FC<GalleryBundlesProps> = ({
  bundlesItems,
  itemsToRemove,
  onSelect,
  onRemove,
  onUndoRemove,
  onRegenerate,
}) => {
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
    <View maxHeight="85vh" overflow="auto">
      {bundlesItems.map(({ bundleName, names, urls }, i) => (
        <div key={i}>
          <Heading>{bundleName}</Heading>
          <Grid
            columns={repeat("auto-fit", "220px")}
            gap="size-100"
            justifyContent="center"
          >
            {names.map((name, j) => (
              <Preview
                key={j}
                name={name}
                url={urls[j]}
                disabled={itemsToRemove.includes(name)}
                showOnDisabled={
                  <Button
                    variant="secondary"
                    onPress={() => onUndoRemove(name)}
                  >
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
        </div>
      ))}
    </View>
  );
};
