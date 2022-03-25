import React from "react";
import { Trait } from "../typings";
import { BundleNode } from "./BundleNode";
import { LayerNode } from "./LayerNode";
import { RenderNode } from "./RenderNode";

interface SidebarProps {
  id: string;
  layers: string[];
  traits: Trait[];
  base64Strings: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  id,
  layers,
  traits,
  base64Strings,
}) => {
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
          onDragStart={(event) => onDragStart(event, { type: "renderNode" })}
          draggable
        >
          <RenderNode
            sidebar
            data={{
              factoryId: id,
              traits,
              base64Strings,
            }}
          />
        </div>
        <div
          onDragStart={(event) => onDragStart(event, { type: "bundleNode" })}
          draggable
        >
          <BundleNode sidebar data={{ bundle: "Lorem ipsum" }} />
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
                base64String: base64Strings[i],
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
