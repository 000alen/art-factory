import { Text } from "@adobe/react-spectrum";
import React, { useEffect, useState } from "react";
import { MAX_SIZE } from "../constants";
import { factoryComposeTraits, factoryGetTraitImage } from "../ipc";
// import { DEFAULT_BLENDING, DEFAULT_OPACITY } from "../constants";
import { Trait } from "../typings";
import { BundleNode } from "./BundleNode";
import { useErrorHandler } from "./ErrorHandler";
import { ImageItem } from "./ImageItem";
// import { LayerNode } from "./LayerNode";
import { RenderNode } from "./RenderNode";

interface SidebarProps {
  id: string;
  layers: string[];
  contractType: string;
  traits: Trait[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  id,
  layers,
  contractType,
  traits,
}) => {
  const task = useErrorHandler();
  const [urls, setUrls] = useState(null);

  useEffect(() => {
    task("sidebar preview", async () => {
      const urls = await Promise.all(
        traits.map((trait) => factoryGetTraitImage(id, trait, MAX_SIZE))
      ).then((base64Strings) =>
        base64Strings.map(
          (base64String) => `data:image/png;base64,${base64String}`
        )
      );

      setUrls(urls);
    })();
  }, [traits]);

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
          <div className="w-20 h-20 p-1 border-[0.5px] border-solid border-white rounded flex justify-center items-center">
            <Text>Bundle</Text>
          </div>
        </div>
        <div
          onDragStart={(event) => onDragStart(event, { type: "renderNode" })}
          draggable
        >
          <div className="w-20 h-20 p-1 border-[0.5px] border-solid border-white rounded flex justify-center items-center">
            <Text>Render</Text>
          </div>
        </div>
        {contractType === "721_reveal_pause" && (
          <div
            onDragStart={(event) =>
              onDragStart(event, { type: "notRevealedNode" })
            }
            draggable
          >
            <div className="w-20 h-20 p-1 border-[0.5px] border-solid border-white rounded flex justify-center items-center">
              <Text>Not revealed</Text>
            </div>
          </div>
        )}
        {urls &&
          layers.map((name, i) => (
            <div
              key={i}
              onDragStart={(event) =>
                onDragStart(event, { name, type: "layerNode" })
              }
              draggable
            >
              <div className="w-20 p-1 flex flex-col border-[0.5px] border-solid border-white rounded">
                <div>
                  <ImageItem src={urls[i]} maxSize={80} />
                  <Text>{name}</Text>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
