import React from "react";
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
  ReactFlowInstance,
} from "react-flow-renderer";
import { Configuration, Trait } from "../typings";
import { v4 as uuid } from "uuid";
import { dashedName, getId, hash, spacedName } from "../utils";
import { getBranches } from "../nodesUtils";
import {
  DEFAULT_BLENDING,
  DEFAULT_NODES,
  DEFAULT_OPACITY,
  EDGE_TYPES,
  MAX_SIZE,
  NODE_TYPES,
} from "../constants";
import { useErrorHandler } from "./ErrorHandler";
import { factoryComposeTraits, factoryGetTraitImage } from "../ipc";
import { LayerNodeComponentData } from "./LayerNode";
import { RenderNodeComponentData } from "./RenderNode";
import { BundleNodeComponentData } from "./BundleNode";

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
  const task = useErrorHandler();

  const reactFlowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [prevKey, setPrevKey] = useState<string | null>(null);

  // ? hash(trait) -> url
  const [urls, setUrls] = useState(new Map<string, string>());
  const updateUrls = (k: string, v: string) => setUrls(new Map(urls.set(k, v)));

  // ? name -> dashedName[]
  const [layersIds, setLayersIds] = useState(new Map<string, string[]>());
  const updateLayersIds = (k: string, v: string[]) =>
    setLayersIds(new Map(layersIds.set(k, v)));

  // ? hash(trait[]) -> url
  const [composedUrls, setComposedUrls] = useState(new Map<string, string>());
  const updateComposedUrls = (k: string, v: string) =>
    setComposedUrls(new Map(composedUrls.set(k, v)));

  // ? hash(trait[]) -> dashedName
  const [renderIds, setRenderIds] = useState(new Map<string, string>());
  const updateRenderIds = (k: string, v: string) =>
    setRenderIds(new Map(renderIds.set(k, v)));

  // ? nodeId -> hash(trait[])
  const [renderNodesHashes, setRenderNodesHashes] = useState(
    new Map<string, Set<string>>()
  );
  const updateRenderNodesHashes = (k: string, v: Set<string>) =>
    setRenderNodesHashes(new Map(renderNodesHashes.set(k, v)));

  // ? dashedName -> number
  const [ns, setNs] = useState(new Map<string, number>());
  const updateNs = (k: string, v: number) => setNs(new Map(ns.set(k, v)));

  const requestUrl = async (trait: Trait) =>
    updateUrls(
      hash(trait),
      `data:image/png;base64,${await factoryGetTraitImage(id, trait, MAX_SIZE)}`
    );

  const requestComposedUrl = async (traits: Trait[]) =>
    updateComposedUrls(
      hash(traits),
      `data:image/png;base64,${await factoryComposeTraits(
        id,
        traits,
        MAX_SIZE
      )}`
    );

  const requestRenderId = (traits: Trait[]) =>
    updateRenderIds(hash(traits), dashedName());

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
    // if (!shouldUpdate(nodes, edges)) return { nodes, edges };

    const toUpdate: Map<string, Trait[][]> = new Map();

    const clean = (node: FlowNode): FlowNode =>
      node.type === "renderNode"
        ? {
            ...node,
            data: {
              ...node.data,
              nTraits: [],
            },
          }
        : node;

    const populate = (node: FlowNode) => {
      if (toUpdate.has(node.id))
        return {
          ...node,
          data: {
            ...node.data,
            composedUrls,
            renderIds,
            hashes: renderNodesHashes.get(node.id),
            ns,
            nTraits: toUpdate.get(node.id),
          },
        };
      else if (node.type === "renderNode") {
        return {
          ...node,
          data: {
            ...node.data,
            composedUrls,
            renderIds,
            hashes: renderNodesHashes.get(node.id),
            ns,
          },
        };
      } else if (node.type === "layerNode") {
        const layerIds = layersIds.get(node.data.name);

        return {
          ...node,
          data: {
            ...node.data,
            layerIds,
            urls,
          },
        };
      } else if (node.type === "bundleNode")
        return {
          ...node,
          data: {
            ...node.data,
            composedUrls,
            renderIds,
            renderNodesHashes,
            ns,
          },
        };
      else return node;
    };

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

  const makeData = (nodeId: string, type: string, name: string) => {
    const factoryId = id;

    switch (type) {
      case "layerNode":
        const index = partialConfiguration.layers.findIndex(
          (e: string) => e === name
        );
        const trait = traits[index];
        const layerId = dashedName();
        const opacity = DEFAULT_OPACITY;
        const blending = DEFAULT_BLENDING;

        const layerIds = [
          ...(layersIds.has(name) ? layersIds.get(name) : []),
          layerId,
        ];
        updateLayersIds(name, layerIds);

        return {
          factoryId,
          trait,
          layerIds,
          urls,

          requestUrl,
          onChangeLayerId,
          onChangeOpacity,
          onChangeBlending,

          layerId,
          name,
          opacity,
          blending,
        } as LayerNodeComponentData;
      case "renderNode":
        const hashes = new Set<string>();
        const updateHashes = (hashes: Set<string>) =>
          updateRenderNodesHashes(nodeId, hashes);

        updateRenderNodesHashes(nodeId, hashes);

        return {
          factoryId,
          composedUrls,
          renderIds,
          hashes,
          ns,

          requestComposedUrl,
          requestRenderId,
          updateHashes,
          updateNs,

          nTraits: [],
        } as RenderNodeComponentData;
      case "bundleNode":
        const bundleId = uuid();

        const bundle = spacedName();
        return {
          factoryId,
          bundleId,
          composedUrls,
          renderIds,
          renderNodesHashes,
          ns,

          bundle,

          onChangeBundle,
        } as BundleNodeComponentData;
      default:
        return {};
    }
  };

  const make = (id: string, type: string, position: any, name: string) => {
    const data = makeData(id, type, name);

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
