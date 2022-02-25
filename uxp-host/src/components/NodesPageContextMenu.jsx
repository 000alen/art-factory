import React from "react";

export function NodesPageContextMenu({ shown, x, y }) {
  const style = {
    top: y,
    left: x,
  };

  return (
    <div className={`absolute ${shown ? "" : `hidden`}`} style={style}>
      NodesPageContextMenu
    </div>
  );
}
