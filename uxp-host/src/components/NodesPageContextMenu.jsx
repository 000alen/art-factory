import React from "react";

export function NodesPageContextMenu({ shown, x, y, layers }) {
  const onDragStart = (event, data) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  const style = {
    top: y,
    left: x,
  };

  return (
    <div
      className={`absolute z-10 ${
        !shown ? `hidden` : `visible`
      } p-2 border-2 border-solid border-white rounded backdrop-blur shadow space-y-2`}
      style={style}
    >
      <div className="font-bold">You can drag these nodes.</div>
      <div
        onDragStart={(event) =>
          onDragStart(event, { type: "output", label: "Render" })
        }
        draggable
      >
        Render
      </div>
      {layers.map((layer, i) => (
        <div
          key={i}
          onDragStart={(event) =>
            onDragStart(event, { type: "layerNode", layer })
          }
          draggable
        >
          {layer}
        </div>
      ))}
    </div>
  );
}
