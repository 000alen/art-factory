import React from "react";
import {
  getBezierPath,
  getEdgeCenter,
  getMarkerEnd,
} from "react-flow-renderer";

const foreignObjectSize = 20;

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  arrowHeadType,
  markerEndId,
}) {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const onEdgeClick = (event) => {
    event.stopPropagation();
    data.onEdgeRemove(id);
    // alert(`remove ${id}`);
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        className="customEdge-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="w-full h-full flex justify-center items-center">
          <button
            className="w-full h-full rounded-full select-none border-none"
            onClick={onEdgeClick}
          >
            ×
          </button>
        </div>
      </foreignObject>
    </>
  );
}
