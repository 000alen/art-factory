import React from "react";
import { Flex, View, ActionButton } from "@adobe/react-spectrum";
import { LayerItem } from "./LayerItem";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import Add from "@spectrum-icons/workflow/Add";

export function ConfigurationLayers({
  layers,
  onAddLayer,
  onEditLayer,
  onMoveDownLayer,
  onMoveUpLayer,
  onRemoveLayer,
}) {
  return (
    <View>
      <label className="spectrum-FieldLabel">Layers</label>

      <View
        width="30vw"
        height="100%"
        padding="size-100"
        overflow="auto"
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
      >
        <Flex direction="column" gap="size-100">
          {layers.map((layer, index) => (
            <LayerItem
              key={index}
              value={layer}
              index={index}
              onChange={onEditLayer}
              onMoveDown={onMoveDownLayer}
              onMoveUp={onMoveUpLayer}
              onRemove={onRemoveLayer}
            />
          ))}
        </Flex>
      </View>
      <ActionButton marginTop={8} onPress={onAddLayer}>
        <Add />
      </ActionButton>
    </View>
  );
}
