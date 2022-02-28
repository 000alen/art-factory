import React from "react";
import { ImageItem } from "./ImageItem";
import { LayerNode } from "./LayerNode";
import { RenderNode } from "./RenderNode";
import { RootNode } from "./RootNode";

export function Sidebar({ layers, buffers, urls }) {
  const onDragStart = (event, data) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="px-4 overflow-auto"
      style={{
        direction: "rtl",
      }}
    >
      <div
        className="p-2 space-y-2 rounded flex flex-col justify-center items-center"
        style={{
          direction: "ltr",
        }}
      >
        <div
          onDragStart={(event) => onDragStart(event, { type: "rootNode" })}
          draggable
        >
          <RootNode sidebar />
        </div>
        <div
          onDragStart={(event) =>
            onDragStart(event, { type: "renderNode", label: "Render" })
          }
          draggable
        >
          <RenderNode
            sidebar
            data={{
              buffers,
            }}
          />
        </div>
        {layers.map((layer, i) => (
          <div
            key={i}
            onDragStart={(event) =>
              onDragStart(event, { type: "layerNode", layer })
            }
            draggable
          >
            <LayerNode
              sidebar
              data={{
                url: urls[i],
                layer,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
