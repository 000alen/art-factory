import React from "react";
import { TextField } from "@adobe/react-spectrum";
import { ArrayOf } from "./ArrayOf";
import "@spectrum-css/fieldlabel/dist/index-vars.css";

interface ConfigurationLayersProps {
  layers: string[];
  setLayers: (layers: string[]) => void;
}

export const ConfigurationLayers: React.FC<ConfigurationLayersProps> = ({
  layers,
  setLayers,
}) => {
  return (
    <ArrayOf
      Component={TextField}
      label="Layers"
      emptyValue=""
      items={layers}
      setItems={setLayers}
    />
  );
};
