import React from "react";

import { Button, Text } from "@adobe/react-spectrum";

interface ImageItemAction {
  label: string;
  onClick: () => void;
}

interface ImageItemProps {
  name?: string;
  src: string;
  actions?: ImageItemAction[];
  maxSize?: number;
}

export const ImageItem: React.FC<ImageItemProps> = ({
  name,
  src,
  actions,
  maxSize,
}) => {
  return (
    <div className="relative w-auto h-auto rounded">
      {actions && (
        <div className="absolute w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] p-2 space-y-2 flex flex-col bg-gray-600 bg-opacity-75 justify-center items-center opacity-0 hover:opacity-100">
          <Text>{name}</Text>
          <div>
            {actions.map((action, i) => (
              <Button key={i} variant="secondary" onPress={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <img
        style={
          maxSize
            ? {
                maxWidth: maxSize,
                maxHeight: maxSize,
              }
            : {}
        }
        className="w-auto h-auto select-none rounded"
        draggable="false"
        src={src}
        alt={name}
      />
    </div>
  );
};
