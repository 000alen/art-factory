import React from "react";
import { Trait } from "../typings";
import { BundleNode } from "./BundleNode";
import { LayerNode } from "./LayerNode";
import { RenderGroupNode } from "./RenderGroupNode";
import { RenderNode } from "./RenderNode";

interface SidebarProps {
  id: string;
  layers: string[];
  traits: Trait[];
}

export const Sidebar: React.FC<SidebarProps> = ({ id, layers, traits }) => {
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
        <div
          onDragStart={(event) => onDragStart(event, { type: "bundleNode" })}
          draggable
        >
          <BundleNode
            id="bundleNode"
            sidebar
            data={{
              factoryId: id,
              bundleId: "<undefined>",
              bundle: "Lorem ipsum",
            }}
          />
        </div>
        <div
          onDragStart={(event) => onDragStart(event, { type: "renderNode" })}
          draggable
        >
          <RenderNode
            id="renderNode"
            sidebar
            data={{
              factoryId: id,
              renderId: "<undefined>",
              nTraits: [traits],
              ns: [1],
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
              id={`layerNode-${i}`}
              sidebar
              data={{
                factoryId: id,
                layerId: "Lorem ipsum",
                name,
                opacity: 1,
                blending: "normal",
                trait: traits[i],
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
