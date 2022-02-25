import React from "react";

export function Sidebar({ layers }) {
  const onDragStart = (event, data) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="p-2 space-y-2">
      <div className="font-bold">
        You can drag these nodes to the pane on the right.
      </div>
      {layers.map((layer, i) => (
        <div
          key={i}
          className="p-2 border-2 border-dashed border-white rounded"
          onDragStart={(event) =>
            onDragStart(event, { type: "layerNode", layer })
          }
          draggable
        >
          {layer}
        </div>
      ))}
    </aside>
  );
}
