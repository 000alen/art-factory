import { Button } from "@adobe/react-spectrum";
import React from "react";

export function ImageItem({ src, onEdit }) {
  return (
    <div className="relative w-32 h-32 rounded-md">
      <div className="absolute w-full h-full bg-gray-600 bg-opacity-75 flex justify-center items-center opacity-0 hover:opacity-100">
        <Button onPress={onEdit}>Edit</Button>
      </div>

      <img className="w-full h-full" src={src} alt="" />
    </div>
  );
}
