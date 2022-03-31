import React, { useCallback } from "react";
import { createContext, useState, useContext, useRef } from "react";
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  Node as FlowNode,
  Edge as FlowEdge,
  Connection as FlowConnection,
  NodeChange as FlowNodeChange,
  EdgeChange as FlowEdgeChange,
} from "react-flow-renderer";
import {
  BundleNodeData,
  Configuration,
  LayerNodeData,
  RenderNodeData,
  Trait,
} from "../typings";
import { v4 as uuid } from "uuid";
import { dashedName, getId, hash, spacedName } from "../utils";
import { getBranches, getChildren } from "../nodesUtils";
import {
  DEFAULT_BLENDING,
  DEFAULT_N,
  DEFAULT_OPACITY,
  EDGE_TYPES,
  NODE_TYPES,
} from "../constants";

interface NodesContextProviderProps {
  id: string;
  autoPlace?: boolean;
  partialConfiguration: Partial<Configuration>;
  traits: Trait[];
}

interface INodesContext {
  id: string;

  reactFlowWrapperRef: React.RefObject<HTMLDivElement>;
  reactFlowInstance: any;

  nodes: FlowNode[];
  edges: FlowEdge[];

  onInit: (reactFlowInstance: any) => void;
  onNodesChange: (changes: FlowNodeChange[]) => void;
  onEdgesChange: (changes: FlowEdgeChange[]) => void;
  onConnect: (connection: FlowConnection) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function useNodes(
  id: string,
  partialConfiguration: Partial<Configuration>,
  traits: Trait[]
) {
  const reactFlowWrapperRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [nodes, setNodes] = useState<FlowNode[]>([
    {
      id: "root",
      type: "rootNode",
      position: { x: 0, y: 0 },
      data: {},
    },
  ]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [prevKey, setPrevKey] = useState(null);

  const shouldUpdate = (nodes: FlowNode[], edges: FlowEdge[]): boolean => {
    const clean = (nodes: FlowNode[]) =>
      nodes.map(({ id, type, data }) => ({
        id,
        type,
        data,
      }));

    const branches = getBranches(nodes, edges).map(clean);
    const key = hash(branches);
    const should = key !== prevKey;
    setPrevKey(key);
    return should;
  };

  const onUpdate = (nodes: FlowNode[], edges: FlowEdge[]) => {
    if (!shouldUpdate(nodes, edges)) return { nodes, edges };

    const toUpdate: Map<string, Trait[][]> = new Map();

    const clean = (node: FlowNode): FlowNode =>
      node.type === "renderNode"
        ? {
            ...node,
            data: {
              ...node.data,
              nTraits: undefined,
            },
          }
        : node;

    const populate = (node: FlowNode) =>
      toUpdate.has(node.id)
        ? {
            ...node,
            data: {
              ...node.data,
              nTraits: toUpdate.get(node.id),
            },
          }
        : node;

    nodes = nodes.map(clean);
    const branches = getBranches(nodes, edges);

    branches.forEach((branch) => {
      branch.shift();
      const render = branch.pop();
      const traits = branch.map((node) => ({
        ...node.data.trait,
        layerId: node.data.layerId,
        opacity: node.data.opacity,
        blending: node.data.blending,
      }));

      if (toUpdate.has(render.id)) {
        toUpdate.set(render.id, [...toUpdate.get(render.id), traits]);
      } else {
        toUpdate.set(render.id, [traits]);
      }
    });
    nodes = nodes.map(populate);

    return { nodes, edges };
  };

  const onNodesChange = (changes: FlowNodeChange[]) =>
    setNodes((ns) => {
      const { nodes, edges: _edges } = onUpdate(
        applyNodeChanges(changes, ns),
        edges
      );
      setEdges(_edges);
      return nodes;
    });

  const onEdgesChange = (changes: FlowEdgeChange[]) =>
    setEdges((es) => {
      const { nodes: _nodes, edges } = onUpdate(
        nodes,
        applyEdgeChanges(changes, es)
      );
      setNodes(_nodes);
      return edges;
    });

  const onEdgeRemove = (id: string) =>
    setEdges((es) => {
      const { nodes: _nodes, edges } = onUpdate(
        nodes,
        es.filter((e) => e.id !== id)
      );
      setNodes(_nodes);
      return edges;
    });

  const onConnect = (connection: FlowConnection) =>
    setEdges((eds) => {
      const { nodes: _nodes, edges } = onUpdate(
        nodes,
        addEdge(
          { ...connection, type: "customEdge", data: { onEdgeRemove } },
          eds
        )
      );
      setNodes(_nodes);
      return edges;
    });

  const onInit = (reactFlowInstance: any) =>
    setReactFlowInstance(reactFlowInstance);

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onChange =
    <T,>(name: string) =>
    (id: string, value: T) =>
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, [name]: value } } : n
        )
      );

  const onChangeLayerId = onChange<string>("layerId");
  const onChangeOpacity = onChange<number>("opacity");
  const onChangeBlending = onChange<string>("blending");
  const onChangeBundle = onChange<string>("bundle");

  const [layersIds, setLayersIds] = useState(new Map<string, string[]>());
  const updateLayersIds = (k: string, v: string[]) =>
    setLayersIds(new Map(layersIds.set(k, v)));

  const getLayerIds = (name: string) =>
    layersIds.has(name) ? layersIds.get(name) : [];


  const renderIds = useState(new Set<string>());

  const makeData = (type: string, name: string) => {
    const factoryId = id;

    switch (type) {
      case "layerNode":
        const trait =
          traits[
            partialConfiguration.layers.findIndex((e: string) => e === name)
          ];
        const layerId = dashedName();
        const opacity = DEFAULT_OPACITY;
        const blending = DEFAULT_BLENDING;

        updateLayersIds(name, [...getLayerIds(name), layerId]);

        return {
          factoryId,
          layerId,

          name,
          trait,

          opacity,
          blending,

          onChangeLayerId,
          getLayerIds,
          onChangeOpacity,
          onChangeBlending,
        } as LayerNodeData;
      case "renderNode":
        const renderId = uuid();

        return {
          factoryId,
          renderId,

          nTraits: [],
          ns: [],
        } as RenderNodeData;
      case "bundleNode":
        const bundleId = uuid();

        const bundle = spacedName();
        return {
          factoryId,
          bundleId,

          bundle,

          onChangeBundle,
        } as BundleNodeData;
      default:
        return {};
    }
  };

  const make = (id: string, type: string, position: any, name: string) => {
    const data = makeData(type, name);

    return {
      id,
      type,
      position,
      data,
    };
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

    onNodesChange([
      {
        item: newNode,
        type: "add",
      },
    ]);
  };

  return {
    id,

    reactFlowWrapperRef,
    reactFlowInstance,

    nodes,
    setNodes,
    edges,
    setEdges,

    onInit,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
  };
}

export const NodesContext = createContext<INodesContext>(null);

export const Nodes: React.FC = ({ children }) => {
  const {
    reactFlowWrapperRef,
    nodes,
    edges,
    onInit,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
  } = useContext(NodesContext);

  return (
    <div className="w-full h-full" ref={reactFlowWrapperRef}>
      <ReactFlow
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        nodes={nodes}
        edges={edges}
        onInit={onInit}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
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
  partialConfiguration,
  children,
  traits,
}) => {
  const value = useNodes(id, partialConfiguration, traits);

  return (
    <NodesContext.Provider value={value}>
      {autoPlace && <Nodes />}
      {children}
    </NodesContext.Provider>
  );
};
