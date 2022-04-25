import React, { useMemo } from "react";

import { Flex, NumberField } from "@adobe/react-spectrum";

interface TimeProps {
  value: number;
  onChange: (value: number) => void;
}

// value: UTC seconds
// days = floor(value / (24 * 60 * 60))
// hours = floor((value - days * 24 * 60 * 60) / (60 * 60))

export const Time: React.FC<TimeProps> = ({ value, onChange }) => {
  const days = useMemo(() => Math.floor(value / (24 * 60 * 60)), [value]);
  const hours = useMemo(
    () => Math.floor((value - days * 24 * 60 * 60) / (60 * 60)),
    [value, days]
  );

  const _onChange = (days: number, hours: number) =>
    onChange(days * (24 * 60 * 60) + hours * (60 * 60));

  return (
    <Flex gap="size-100">
      <NumberField
        label="Days"
        minValue={0}
        value={days}
        onChange={(days) => _onChange(days, hours)}
      />
      <NumberField
        label="Hours"
        minValue={0}
        value={hours}
        onChange={(hours) => _onChange(days, hours)}
      />
    </Flex>
  );
};
