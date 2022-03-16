import { Button } from "@adobe/react-spectrum";
import React from "react";

export function ImageItem({
  src,
  onEdit,
}: {
  src: string;
  onEdit?: () => void;
}) {
  return (
    <div className="relative w-32 m-auto rounded">
      {onEdit && (
        <div className="absolute w-full h-full bg-gray-600 bg-opacity-75 flex justify-center items-center opacity-0 hover:opacity-100">
          <Button variant="secondary" onPress={onEdit}>
            Edit
          </Button>
        </div>
      )}

      <img
        className="w-full select-none rounded"
        draggable="false"
        src={src}
        alt=""
      />
    </div>
  );
}
