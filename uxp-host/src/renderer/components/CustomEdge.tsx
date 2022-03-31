import React, { CSSProperties, MouseEvent } from "react";
import {
  getBezierPath,
  getEdgeCenter,
  getMarkerEnd,
  Position,
  MarkerType,
} from "react-flow-renderer";
import { EdgeChange as FlowEdgeChange } from "react-flow-renderer";

const foreignObjectSize = 20;

interface CustomEdgeComponentData {
  onEdgeRemove: (id: string) => void;
}

interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style: CSSProperties;
  data: CustomEdgeComponentData;
  arrowHeadType: MarkerType;
  markerEndId: string;
}

export const CustomEdge: React.FC<CustomEdgeProps> = ({
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
}) => {
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

  const onEdgeClick = (event: MouseEvent) => {
    event.stopPropagation();
    data.onEdgeRemove(id);
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
};
