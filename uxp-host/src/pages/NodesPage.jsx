import React, { useState, useRef, useEffect, useContext } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  removeElements,
  Controls,
} from "react-flow-renderer";
import { Sidebar } from "../components/NodesPageSidebar";
import { DialogContext } from "../App";
import { useLocation, useNavigate } from "react-router-dom";
import { LayerNode } from "../components/LayerNode";
import { NodesPageContextMenu } from "../components/NodesPageContextMenu";

let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  layerNode: LayerNode,
};

export function NodesPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, attributes, inputDir, outputDir, photoshop, configuration } =
    state;

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [elements, setElements] = useState([]);
  const [contextMenuShown, setContextMenuShown] = useState(false);
  const [contextMenuX, setContextMenuX] = useState(0);
  const [contextMenuY, setContextMenuY] = useState(0);

  useEffect(() => {
    setElements([
      {
        id: "1",
        type: "input",
        sourcePosition: "right",
        // targetPosition: "left",
        data: { label: "Root" },
        position: { x: 0, y: 0 },
      },
      ...configuration.layers.map((layer, i) => ({
        id: (i + 2).toString(),
        type: "layerNode",
        sourcePosition: "right",
        targetPosition: "left",
        data: { id, layer },
        position: { x: 250 * (i + 1), y: 100 * i },
      })),
      {
        id: "-1",
        type: "output",
        // sourcePosition: "left",
        targetPosition: "left",
        data: { label: "Render" },
        position: { x: 0, y: 100 },
      },
    ]);
  }, []);

  const onConnect = (params) => {
    setElements((els) => addEdge(params, els));
  };

  const onElementsRemove = (elementsToRemove) => {
    setElements((els) => removeElements(elementsToRemove, els));
  };

  const onLoad = (_reactFlowInstance) => {
    setReactFlowInstance(_reactFlowInstance);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const { type, label, layer } = JSON.parse(
      event.dataTransfer.getData("application/reactflow")
    );

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNode = {
      id: getId(),
      type,
      sourcePosition: "right",
      targetPosition: "left",
      position,
      data: { id, layer, label },
    };

    setElements((es) => es.concat(newNode));
    setContextMenuShown(false);
  };

  const onPaneContextMenu = (event) => {
    event.preventDefault();
    setContextMenuX(event.clientX);
    setContextMenuY(event.clientY);
    setContextMenuShown(true);
  };

  return (
    <div className="w-full h-full flex">
      <ReactFlowProvider>
        <div className="w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            elements={elements}
            onConnect={onConnect}
            onElementsRemove={onElementsRemove}
            onLoad={onLoad}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={() => setContextMenuShown(false)}
            onMove={() => {
              if (contextMenuShown) setContextMenuShown(false);
            }}
            nodeTypes={nodeTypes}
            deleteKeyCode={46}
            snapToGrid={true}
          >
            <Controls />
          </ReactFlow>
        </div>
        <NodesPageContextMenu
          shown={contextMenuShown}
          x={contextMenuX}
          y={contextMenuY}
          layers={configuration.layers}
        />
        {/* <Sidebar layers={configuration.layers} /> */}
      </ReactFlowProvider>
    </div>
  );
}
