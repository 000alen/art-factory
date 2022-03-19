import React, { MouseEvent } from "react";
import { LayerNode } from "./LayerNode";
import { RenderNode } from "./RenderNode";

export function Sidebar({
  layers,
  buffers,
  urls,
}: {
  layers: string[];
  buffers: any[];
  urls: string[];
}) {
  const onDragStart = (event: any, data: any) => {
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
        {/* <div
            onDragStart={(event) =>
              onDragStart(event, { type: "switchNode", label: "Switch" })
            }
            draggable
          >
            <SwitchNode
              sidebar
              data={{
                buffers,
              }}
            />
          </div> */}
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
        {layers.map((name, i) => (
          <div
            key={i}
            onDragStart={(event) =>
              onDragStart(event, { name, type: "layerNode" })
            }
            draggable
          >
            <LayerNode
              sidebar
              data={{
                name,
                url: urls[i],
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
