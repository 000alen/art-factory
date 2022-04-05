import { Button, Text } from "@adobe/react-spectrum";
import React from "react";

interface ImageItemAction {
  label: string;
  onClick: () => void;
}

interface ImageItemProps {
  name?: string;
  src: string;
  actions?: ImageItemAction[];
}

export const ImageItem: React.FC<ImageItemProps> = ({ name, src, actions }) => {
  return (
    <div className="relative w-full h-full m-auto rounded">
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
        className="w-full h-full select-none rounded"
        draggable="false"
        src={src}
        alt={name}
      />
    </div>
  );
};
