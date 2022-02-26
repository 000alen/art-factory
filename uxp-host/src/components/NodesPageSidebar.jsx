import React from "react";
import { ImageItem } from "./ImageItem";

export function Sidebar({ layers, urls }) {
  const onDragStart = (event, data) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="overflow-auto"
      style={{
        direction: "rtl",
      }}
    >
      <div
        className="p-2 space-y-2 rounded flex flex-col"
        style={{
          direction: "ltr",
        }}
      >
        <div className="font-bold">You can drag these nodes.</div>
        <div
          onDragStart={(event) =>
            onDragStart(event, { type: "renderNode", label: "Render" })
          }
          draggable
        >
          Render
        </div>
        {layers.map((layer, i) => (
          <div
            key={i}
            className="p-2 border-2 border-dashed border-white rounded flex flex-col justify-center"
            onDragStart={(event) =>
              onDragStart(event, { type: "layerNode", layer })
            }
            draggable
          >
            <ImageItem src={urls[i]} />
            <div>{layer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
