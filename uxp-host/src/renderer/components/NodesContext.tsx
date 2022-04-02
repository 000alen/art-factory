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
import { useMap } from "../hooks/useMap";

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
  const urls = useMap<string, string>();

  // ? name -> dashedName[]
  const layersIds = useMap<string, string[]>();

  // ? hash(trait[]) -> url
  const composedUrls = useMap<string, string>();

  // ? hash(trait[]) -> dashedName
  const renderIds = useMap<string, string>();

  // ? nodeId -> hash(trait[])
  const renderNodesHashes = useMap<string, Set<string>>();

  // ? dashedName -> number
  const ns = useMap<string, number>();

  const requestUrl = async (trait: Trait) => {
    const base64String = await factoryGetTraitImage(id, trait, MAX_SIZE);
    await urls.set(hash(trait), `data:image/png;base64,${base64String}`);
  };

  const requestComposedUrl = async (traits: Trait[]) => {
    const composedBase64String = await factoryComposeTraits(
      id,
      traits,
      MAX_SIZE
    );
    await composedUrls.set(
      hash(traits),
      `data:image/png;base64,${composedBase64String}`
    );
  };

  const requestRenderId = async (traits: Trait[]) => {
    const name = dashedName();
    await renderIds.set(hash(traits), name);
  };

  const updateNs = async (k: string, v: number) => await ns.set(k, v);

  const shouldBranchesUpdate = (
    nodes: FlowNode[],
    edges: FlowEdge[]
  ): boolean => {
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

  const onUpdateBranches = (nodes: FlowNode[], edges: FlowEdge[]) => {
    if (!shouldBranchesUpdate(nodes, edges)) return { nodes, edges };

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

    const update = (node: FlowNode) =>
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

      if (toUpdate.has(render.id))
        toUpdate.set(render.id, [...toUpdate.get(render.id), traits]);
      else toUpdate.set(render.id, [traits]);
    });

    // for (const nTraits of toUpdate.values())
    //   for (const traits of nTraits) await requestComposedUrl(traits);

    return { nodes: nodes.map(update), edges };
  };

  const onNodesChange = (changes: FlowNodeChange[]) =>
    setNodes((ns) => {
      let { nodes, edges: _edges } = onUpdateBranches(
        applyNodeChanges(changes, ns),
        edges
      );
      return nodes;
    });

  const onEdgesChange = (changes: FlowEdgeChange[]) =>
    setEdges((es) => {
      let { nodes: _nodes, edges } = onUpdateBranches(
        nodes,
        applyEdgeChanges(changes, es)
      );
      setNodes(_nodes);
      return edges;
    });

  const onEdgeRemove = (id: string) =>
    setEdges((es) => {
      let { nodes: _nodes, edges } = onUpdateBranches(
        nodes,
        es.filter((e) => e.id !== id)
      );
      setNodes(_nodes);
      return edges;
    });

  const onConnect = (connection: FlowConnection) =>
    setEdges((eds) => {
      let { nodes: _nodes, edges } = onUpdateBranches(
        nodes,
        addEdge(
          { ...connection, type: "customEdge", data: { onEdgeRemove } },
          eds
        )
      );
      setNodes(_nodes);
      return edges;
    });

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onInit = (reactFlowInstance: any) =>
    setReactFlowInstance(reactFlowInstance);

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

  const makeData = async (nodeId: string, type: string, name: string) => {
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

        await layersIds.set(name, [
          ...(layersIds.has(name) ? layersIds.get(name) : []),
          layerId,
        ]);
        await requestUrl(trait);

        return {
          factoryId,
          trait,
          layersIds: layersIds.mapRef,
          urls: urls.mapRef,

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
        const updateHashes = (hashes: Set<string>) =>
          renderNodesHashes.set(nodeId, hashes);

        await renderNodesHashes.set(nodeId, new Set<string>());

        return {
          factoryId,
          composedUrls: composedUrls.mapRef,
          renderIds: renderIds.mapRef,
          renderNodeHashes: renderNodesHashes.mapRef,
          ns: ns.mapRef,

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
          composedUrls: composedUrls.mapRef,
          renderIds: renderIds.mapRef,
          renderNodesHashes: renderNodesHashes.mapRef,
          ns: ns.mapRef,

          bundle,

          onChangeBundle,
        } as BundleNodeComponentData;
      default:
        return {};
    }
  };

  const make = async (
    id: string,
    type: string,
    position: any,
    name: string
  ) => {
    const data = await makeData(id, type, name);

    return {
      id,
      type,
      position,
      data,
    };
  };

  const onDrop = async (event: any) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapperRef.current.getBoundingClientRect();
    const { type, name } = JSON.parse(
      event.dataTransfer.getData("application/reactflow")
    );

    const newNode = await make(
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
