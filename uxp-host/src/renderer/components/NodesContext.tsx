import React, { useEffect } from "react";
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
  getIncomers,
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
  Configuration,
  RenderNode as IRenderNode,
  BundleNode as IBundleNode,
  Edge,
  Trait,
} from "../typings";
import { v4 as uuid } from "uuid";

interface NodesContextProviderProps {
  id: string;
  autoPlace?: boolean;
  elements: FlowElements;
  setElements: (
    elements: FlowElements | ((prev: FlowElements) => FlowElements)
  ) => void;
  partialConfiguration: Partial<Configuration>;
  partialNodes?: any[];
  traits: Trait[];
  base64Strings: string[];
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

    if (actualNode.node.type === "renderNode") {
      savedPaths.push(actualNode.path);
    } else {
      for (const v of neighbors) {
        stack.push({
          node: v,
          path: [...actualNode.path, v],
        });
      }
    }
  }

  return savedPaths;
}

export function getBundles(
  nodesAndEdges: NodesAndEdges
): Map<string, string[]> {
  const bundleNodes = nodesAndEdges.filter(
    (node) => node.type === "bundleNode"
  ) as IBundleNode[];

  const bundles = new Map();
  for (const bundleNode of bundleNodes) {
    bundles.set(
      bundleNode.data.bundle,
      (
        getIncomers(
          bundleNode as FlowNode,
          nodesAndEdges as FlowElements
        ) as IRenderNode[]
      ).map((node) => node.data.renderId)
    );
  }

  return bundles;
}

const cleanRender = (element: any) =>
  element.type === "renderNode"
    ? {
        ...element,
        data: {
          ...element.data,
          connected: false,
          traits: undefined,
          base64Strings: undefined,
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
          traits: toUpdate[element.id].traits,
          base64Strings: toUpdate[element.id].base64Strings,
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
  factoryId: string,
  id: string,
  type: string,
  position: any,
  name: string,
  traits: Trait[],
  base64Strings: string[],
  partialConfiguration: Partial<Configuration>,
  onChangeOpacity: (id: string, value: number) => void,
  onChangeBlending: (id: string, value: string) => void,
  onChangeN: (id: string, value: number) => void,
  onChangeBundle: (id: string, value: string) => void
) => ({
  id,
  type,
  position,
  data: {
    ...(type === "layerNode"
      ? {
          name,
          trait:
            traits[
              partialConfiguration.layers.findIndex((e: string) => e === name)
            ],
          base64String:
            base64Strings[
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
          factoryId,
          n: 1,
          renderId: uuid(),
          onChangeN: (n: number) => onChangeN(id, n),
        }
      : type === "bundleNode"
      ? {
          bundle: "",
          onChangeBundle: (bundle: string) => onChangeBundle(id, bundle),
        }
      : {}),
  },
});

export function useNodes(
  id: string,
  elements: any[],
  setElements: (elements: any[] | ((prevElements: any[]) => any[])) => void,
  partialConfiguration: any,
  traits: Trait[],
  base64Strings: string[]
) {
  const reactFlowWrapperRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onChangeBundle = property("bundle", setElements);
  const onChangeN = property("n", setElements);
  const onChangeOpacity = property("opacity", setElements);
  const onChangeBlending = property("blending", setElements);

  const updateRender = () => {
    setElements((prevElements) => {
      const toUpdate: Record<
        string,
        { traits: Trait[]; base64Strings: string[] }
      > = {};

      prevElements = prevElements.map(cleanRender);

      getBranches(prevElements).forEach((branch) => {
        branch.shift();
        const render = branch.pop() as IRenderNode;
        const traits: Trait[] = branch.map((node) => node.data.trait);
        const base64Strings: string[] = branch.map(
          (node) => node.data.base64String
        );
        toUpdate[render.id] = { traits, base64Strings };
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
      id,
      getId(),
      type,
      reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }),
      name,
      traits,
      base64Strings,
      partialConfiguration,
      onChangeOpacity,
      onChangeBlending,
      onChangeN,
      onChangeBundle
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
    onChangeBundle,
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
  onChangeBundle: (id: string, bundle: string) => {},
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
  id,
  autoPlace = true,
  elements,
  setElements,
  partialConfiguration,
  children,
  traits,
  base64Strings,
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
  } = useNodes(
    id,
    elements,
    setElements,
    partialConfiguration,
    traits,
    base64Strings
  );

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
