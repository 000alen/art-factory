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
  Trait,
} from "../typings";
import { v4 as uuid } from "uuid";

import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

interface NodesContextProviderProps {
  id: string;
  autoPlace?: boolean;
  elements: FlowElements;
  setElements: (
    elements: FlowElements | ((prev: FlowElements) => FlowElements)
  ) => void;
  partialConfiguration: Partial<Configuration>;
  traits: Trait[];
  base64Strings: string[];
}

interface INodesContext {
  reactFlowWrapperRef: React.RefObject<HTMLDivElement>;
  reactFlowInstance: any;
  elements: FlowElements;

  onConnect: (connection: FlowEdge | FlowConnection) => void;
  onElementsRemove: (elements: FlowElements) => void;
  onEdgeRemove: (id: string) => void;
  onLoad: (reactFlowInstance: any) => void;
  onDragOver: (event: any) => void;
  onDrop: (event: any) => void;

  onChangeBundle: (id: string, value: string) => void;
  onChangeN: (id: string, value: number) => void;
  onChangeOpacity: (id: string, value: number) => void;
  onChangeBlending: (id: string, value: string) => void;
  onChangeLayerId: (id: string, value: string) => void;

  getLayerIds: (name: string) => string[];
}

let id = 0;
export const getId = () => `${id++}`;

const spacedName = {
  dictionaries: [colors, adjectives, animals],
  separator: " ",
  length: 2,
};

const dashedName = {
  dictionaries: [colors, adjectives, animals],
  separator: "-",
  length: 2,
};

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

const clean = (element: any) =>
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

const populate = (element: any, toUpdate: any) =>
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

export function useNodes(
  id: string,
  elements: FlowElements,
  setElements: (
    elements: FlowElements | ((prevElements: FlowElements) => FlowElements)
  ) => void,
  partialConfiguration: Partial<Configuration>,
  traits: Trait[],
  base64Strings: string[]
) {
  const reactFlowWrapperRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [layersIds, setLayersIds] = useState(new Map<string, string[]>());
  const updateLayersIds = (k: string, v: string[]) =>
    setLayersIds(new Map(layersIds.set(k, v)));

  const onChange = (name: string) => (id: string, value: any) =>
    setElements((ps: any) =>
      ps.map((p: any) =>
        p.id === id
          ? {
              ...p,
              data: { ...p.data, [name]: value },
            }
          : p
      )
    );

  const make = (
    elementId: string,
    type: string,
    position: any,
    name: string
  ) => {
    let data;
    switch (type) {
      case "layerNode":
        const index = partialConfiguration.layers.findIndex(
          (e: string) => e === name
        );
        const trait = traits[index];
        const base64String = base64Strings[index];
        const layerId = uniqueNamesGenerator(dashedName);
        const opacity = 1;
        const blending = "normal";

        updateLayersIds(name, [...(layersIds.get(name) || []), layerId]);

        data = {
          name,
          trait,
          base64String,
          layerId,
          opacity,
          blending,
        };
        break;
      case "renderNode":
        const factoryId = id;
        const renderId = uuid();
        const n = 1;

        data = {
          factoryId,
          renderId,
          n,
        };
        break;
      case "bundleNode":
        const bundle = uniqueNamesGenerator(spacedName);
        data = {
          bundle,
        };
        break;
      default:
        data = {};
        break;
    }

    return {
      id: elementId,
      type,
      position,
      data,
    };
  };

  const onChangeBundle = onChange("bundle");
  const onChangeN = onChange("n");
  const onChangeOpacity = onChange("opacity");
  const onChangeBlending = onChange("blending");
  const onChangeLayerId = onChange("layerId");

  const update = () => {
    setElements((prevElements) => {
      const toUpdate: Record<
        string,
        { traits: Trait[]; base64Strings: string[] }
      > = {};

      prevElements = prevElements.map(clean);

      getBranches(prevElements as NodesAndEdges).forEach((branch) => {
        branch.shift();
        const render = branch.pop() as IRenderNode;
        const traits: Trait[] = branch.map((node) => node.data.trait);
        const base64Strings: string[] = branch.map(
          (node) => node.data.base64String
        );
        toUpdate[render.id] = { traits, base64Strings };
      });

      prevElements = prevElements.map((prevElement) =>
        populate(prevElement, toUpdate)
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
    update();
  };

  const onElementsRemove = (elements: FlowElements) => {
    setElements((prevElements) => removeElements(elements, prevElements));
    update();
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

    const newNode = make(
      getId(),
      type,
      reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }),
      name
    );

    setElements((prevElements) => prevElements.concat(newNode));
    update();
  };

  const getLayerIds = (name: string) => layersIds.get(name) || [];

  return {
    reactFlowWrapperRef,
    reactFlowInstance,
    elements,
    update,
    onConnect,
    onElementsRemove,
    onEdgeRemove,
    onLoad,
    onDragOver,
    onDrop,
    onChangeBundle,
    onChangeN,
    onChangeOpacity,
    onChangeBlending,
    onChangeLayerId,

    getLayerIds,
  };
}

export const NodesContext = createContext<INodesContext>(null);

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
        elements={elements}
        onConnect={onConnect}
        onElementsRemove={onElementsRemove}
        onLoad={onLoad}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
  const value = useNodes(
    id,
    elements,
    setElements,
    partialConfiguration,
    traits,
    base64Strings
  );

  return (
    <NodesContext.Provider value={value}>
      {autoPlace && <Nodes />}
      {children}
    </NodesContext.Provider>
  );
};
