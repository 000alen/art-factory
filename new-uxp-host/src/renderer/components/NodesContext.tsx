import React from "react";
import { createContext, useState, useContext, useRef } from "react";
import { RootNode } from "./RootNode";
import { LayerNode } from "./LayerNode";
import { RenderNode } from "./RenderNode";
import { CustomEdge } from "./CustomEdge";
import ReactFlow, {
  addEdge,
  removeElements,
  Controls,
  Background,
  getOutgoers,
  BackgroundVariant,
  Elements as FlowElements,
  Node as FlowNode,
  Edge as FlowEdge,
  Connection as FlowConnection,
} from "react-flow-renderer";
import { BundleNode } from "./BundleNode";
import {
  NodesAndEdges,
  Node,
  RenderNode as IRenderNode,
  Configuration,
} from "../typings";

interface NodesContextProviderProps {
  autoPlace?: boolean;
  elements: FlowElements;
  setElements: (
    elements: FlowElements | ((prev: FlowElements) => FlowElements)
  ) => void;
  partialConfiguration: Partial<Configuration>;
  buffers: Buffer[];
  urls: string[];
}

let id = 0;
export const getId = () => `${id++}`;

const nodeTypes = {
  rootNode: RootNode,
  layerNode: LayerNode,
  renderNode: RenderNode,
  bundleNode: BundleNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

export function getBranches(nodesAndEdges: NodesAndEdges): Node[][] {
  const root = nodesAndEdges.find((node) => node.type === "rootNode") as Node;

  const stack: {
    node: Node;
    path: Node[];
  }[] = [
    {
      node: root,
      path: [root],
    },
  ];

  const savedPaths = [];
  while (stack.length > 0) {
    const actualNode = stack.pop();
    const neighbors = getOutgoers(
      actualNode.node as FlowNode,
      nodesAndEdges as FlowElements
    ) as Node[];

    if (neighbors.length === 0 && actualNode.node.type === "renderNode")
      savedPaths.push(actualNode.path);

    for (const v of neighbors) {
      stack.push({
        node: v,
        path: [...actualNode.path, v],
      });
    }
  }

  return savedPaths;
}

const cleanRender = (element: any) =>
  element.type === "renderNode"
    ? {
        ...element,
        data: {
          ...element.data,
          connected: false,
          buffers: undefined,
          urls: undefined,
        },
      }
    : element;

const populateRender = (element: any, toUpdate: any) =>
  element.id in toUpdate
    ? {
        ...element,
        data: {
          ...element.data,
          connected: true,
          buffers: toUpdate[element.id][0],
          urls: toUpdate[element.id][1],
        },
      }
    : element;

const property =
  (
    name: string,
    setElements: (value: any | ((prevValue: any) => any)) => void
  ) =>
  (id: string, value: any) =>
    setElements((prevElements: any) =>
      prevElements.map((prevElement: any) =>
        prevElement.id === id
          ? {
              ...prevElement,
              data: { ...prevElement.data, [name]: value },
            }
          : prevElement
      )
    );

const makeNode = (
  id: string,
  type: string,
  position: any,
  name: string,
  buffers: Buffer[],
  urls: string[],
  partialConfiguration: Partial<Configuration>,
  onChangeOpacity: (id: string, value: number) => void,
  onChangeBlending: (id: string, value: string) => void,
  onChangeN: (id: string, value: number) => void
) => ({
  id,
  type,
  position,
  data: {
    ...(type === "layerNode"
      ? {
          name,
          buffer:
            buffers[
              partialConfiguration.layers.findIndex((e: string) => e === name)
            ],
          url: urls[
            partialConfiguration.layers.findIndex((e: string) => e === name)
          ],
          opacity: 1,
          blending: "normal",
          onChangeOpacity: (opacity: number) => onChangeOpacity(id, opacity),
          onChangeBlending: (blending: string) =>
            onChangeBlending(id, blending),
        }
      : type === "renderNode"
      ? {
          n: 1,
          onChangeN: (n: number) => onChangeN(id, n),
        }
      : {}),
  },
});

export function useNodes(
  elements: any[],
  setElements: (elements: any[] | ((prevElements: any[]) => any[])) => void,
  partialConfiguration: any,
  buffers: any[],
  urls: string[]
) {
  const reactFlowWrapperRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onChangeN = property("n", setElements);
  const onChangeOpacity = property("opacity", setElements);
  const onChangeBlending = property("blending", setElements);

  const updateRender = () => {
    setElements((prevElements) => {
      const toUpdate: Record<string, [Buffer[], string[]]> = {};

      prevElements = prevElements.map(cleanRender);

      getBranches(prevElements).forEach((branch) => {
        branch.shift();
        const render = branch.pop() as IRenderNode;
        const buffers = branch.map((node) => node.data.buffer);
        const urls = branch.map((node) => node.data.url);
        toUpdate[render.id] = [buffers, urls];
      });

      prevElements = prevElements.map((prevElement) =>
        populateRender(prevElement, toUpdate)
      );

      return prevElements;
    });
  };

  const onConnect = (connection: FlowEdge | FlowConnection) => {
    setElements((prevElements) =>
      addEdge(
        { ...connection, type: "customEdge", data: { onEdgeRemove } },
        prevElements
      )
    );
    updateRender();
  };

  const onElementsRemove = (elements: FlowElements) => {
    setElements((prevElements) => removeElements(elements, prevElements));
    updateRender();
  };

  const onEdgeRemove = (id: string) => {
    onElementsRemove([{ id }] as FlowElements);
  };

  const onLoad = (reactFlowInstance: any) => {
    setReactFlowInstance(reactFlowInstance);
  };

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: any) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapperRef.current.getBoundingClientRect();
    const { type, name } = JSON.parse(
      event.dataTransfer.getData("application/reactflow")
    );

    const newNode = makeNode(
      getId(),
      type,
      reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }),
      name,
      buffers,
      urls,
      partialConfiguration,
      onChangeOpacity,
      onChangeBlending,
      onChangeN
    );

    setElements((prevElements) => prevElements.concat(newNode));
    updateRender();
  };

  return {
    reactFlowWrapperRef,
    reactFlowInstance,
    elements,
    onChangeN,
    onChangeOpacity,
    onChangeBlending,
    updateRender,
    onConnect,
    onElementsRemove,
    onEdgeRemove,
    onLoad,
    onDragOver,
    onDrop,
  };
}

export const NodesContext = createContext({
  reactFlowWrapperRef: null,
  reactFlowInstance: null,
  elements: [],
  onChangeN: (id: string, n: number) => {},
  onChangeOpacity: (id: string, opacity: number) => {},
  onChangeBlending: (id: string, blending: string) => {},
  updateRender: () => {},
  onConnect: (connection: FlowEdge | FlowConnection) => {},
  onElementsRemove: (elements: FlowElements) => {},
  onEdgeRemove: (id: string) => {},
  onLoad: (reactFlowInstance: any) => {},
  onDragOver: (event: any) => {},
  onDrop: (event: any) => {},
});

export const Nodes: React.FC = ({ children }) => {
  const {
    reactFlowWrapperRef,
    elements,
    onConnect,
    onElementsRemove,
    onLoad,
    onDragOver,
    onDrop,
  } = useContext(NodesContext);

  return (
    <div className="w-full h-full" ref={reactFlowWrapperRef}>
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        elements={elements}
        onConnect={onConnect}
        onElementsRemove={onElementsRemove}
        onLoad={onLoad}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={50} />
        {children}
      </ReactFlow>
    </div>
  );
};

export const NodesContextProvider: React.FC<NodesContextProviderProps> = ({
  autoPlace = true,
  elements,
  setElements,
  partialConfiguration,
  buffers,
  urls,
  children,
}) => {
  const {
    reactFlowWrapperRef,
    reactFlowInstance,
    onChangeN,
    updateRender,
    onConnect,
    onElementsRemove,
    onEdgeRemove,
    onLoad,
    onDragOver,
    onDrop,
  } = useNodes(elements, setElements, partialConfiguration, buffers, urls);

  return (
    <NodesContext.Provider
      // @ts-ignore
      value={{
        reactFlowWrapperRef,
        reactFlowInstance,
        elements,
        onChangeN,
        updateRender,
        onConnect,
        onElementsRemove,
        onEdgeRemove,
        onLoad,
        onDragOver,
        onDrop,
      }}
    >
      {autoPlace && <Nodes />}
      {children}
    </NodesContext.Provider>
  );
};
