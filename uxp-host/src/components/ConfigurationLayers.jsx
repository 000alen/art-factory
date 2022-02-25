import React from "react";
import { TextField } from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { ArrayOf } from "./ArrayOf";

export function ConfigurationLayers({ layers, setLayers }) {
  return (
    <ArrayOf
      Component={TextField}
      label="Layers"
      emptyValue=""
      items={layers}
      setItems={setLayers}
    />
  );
}
