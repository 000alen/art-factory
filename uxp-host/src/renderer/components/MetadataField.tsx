import React from "react";

import { Flex, TextField } from "@adobe/react-spectrum";

interface MetadataFieldProps {
  value: { key: string; value: string };
  onChange: (value: { key: string; value: string }) => void;
}

export const MetadataField: React.FC<MetadataFieldProps> = ({
  value,
  onChange,
}) => {
  const { key: k, value: v } = value;

  return (
    <Flex gap="size-100" width="100%">
      <TextField
        isQuiet
        width="50%"
        value={k}
        onChange={(k: string) => onChange({ key: k, value: v })}
      />
      {":"}
      <TextField
        width="100%"
        value={v}
        onChange={(v: string) => onChange({ key: k, value: v })}
      />
    </Flex>
  );
};
