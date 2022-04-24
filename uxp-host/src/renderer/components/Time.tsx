import React from "react";

import { Flex, NumberField } from "@adobe/react-spectrum";

interface TimeProps {
  value: number;
  onChange: (value: number) => void;
}

export const Time: React.FC<TimeProps> = ({ value, onChange }) => {
  return (
    <Flex gap="size-100">
      <NumberField label="Days" />
      <NumberField label="Hours" />
    </Flex>
  );
};
