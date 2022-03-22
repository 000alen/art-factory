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
    <div className="relative w-32 h-32 m-auto rounded">
      {actions && (
        <div className="absolute w-full h-full space-y-2 flex flex-col bg-gray-600 bg-opacity-75 justify-center items-center opacity-0 hover:opacity-100">
          <Text>{name}</Text>
          {actions.map((action, i) => (
            <Button key={i} variant="secondary" onPress={action.onClick}>
              {action.label}
            </Button>
          ))}
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
