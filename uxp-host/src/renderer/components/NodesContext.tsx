import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Connection as FlowConnection,
  Controls,
  Edge as FlowEdge,
  EdgeChange as FlowEdgeChange,
  Node as FlowNode,
  NodeChange as FlowNodeChange,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "react-flow-renderer";

import {
  DEFAULT_BLENDING,
  DEFAULT_NODES,
  DEFAULT_OPACITY,
  DEFAULT_PRICE,
  MAX_SIZE,
} from "../constants";
import {
  factoryComposeTraits,
  factoryComputeMaxCombinations,
  factoryGetTraitImage,
} from "../ipc";
import { Trait } from "../typings";
import { dashedName, getId, hash, spacedName } from "../utils";
import { BundleNode, BundleNodeComponentData } from "./BundleNode";
import { CustomEdge } from "./CustomEdge";
import { LayerNode, LayerNodeComponentData } from "./LayerNode";
import { RenderNode, RenderNodeComponentData } from "./RenderNode";
import { RootNode } from "./RootNode";

interface NodesContextProviderProps {
  id: string;
  autoPlace?: boolean;
  layers: string[];
  traits: Trait[];
  setter: (getter: () => NodesInstance) => void;

  initialNodes?: FlowNode[];
  initialEdges?: FlowEdge[];
  initialRenderIds?: Record<string, string>;
  initialNs?: Record<string, number>;
  initialIgnored?: string[];
  initialPrices?: Record<string, number>;

  setDirty: (dirty: boolean) => void;
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

export interface NodesInstance {
  nodes: FlowNode[];
  edges: FlowEdge[];
  urls: Record<string, string>;
  composedUrls: Record<string, string>;
  renderIds: Record<string, string>;
  ns: Record<string, number>;
  ignored: string[];
  prices: Record<string, number>;
}

export const NODE_TYPES = {
  rootNode: RootNode,
  layerNode: LayerNode,
  renderNode: RenderNode,
  bundleNode: BundleNode,
};

export const EDGE_TYPES = {
  customEdge: CustomEdge,
};

export function useNodes(
  id: string,
  layers: string[],
  traits: Trait[],
  setter: (getter: () => NodesInstance) => void,
  initialNodes?: FlowNode[],
  initialEdges?: FlowEdge[],
  initialRenderIds?: Record<string, string>,
  initialNs?: Record<string, number>,
  initialIgnored?: string[],
  initialPrices?: Record<string, number>,
  setDirty?: (dirty: boolean) => void
) {
  const reactFlowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, _onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, _onEdgesChange] = useEdgesState([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [composedUrls, setComposedUrls] = useState<Record<string, string>>({});
  const [renderIds, setRenderIds] = useState<Record<string, string>>(
    initialRenderIds || {}
  );
  const [ns, setNs] = useState<Record<string, number>>(initialNs || {});
  const [maxNs, setMaxNs] = useState<Record<string, number>>({});
  const [ignored, setIgnored] = useState<string[]>(initialIgnored || []);
  const [prices, setPrices] = useState<Record<string, number>>(
    initialPrices || {}
  );

  useEffect(() => {
    if (traits.length === 0) return; // ! TODO: Nodes don't work without traits

    if (initialNodes) setNodes(hydrateNodes(initialNodes));
    if (initialEdges) setEdges(hydrateEdges(initialEdges));
  }, [initialNodes, initialEdges, traits]);

  useEffect(() => {
    setter(() => ({
      nodes,
      edges,
      urls,
      composedUrls,
      renderIds,
      ns,
      ignored,
      prices,
    }));
  }, [
    setter,
    nodes,
    edges,
    urls,
    composedUrls,
    renderIds,
    ns,
    ignored,
    prices,
  ]);

  const onNodesChange = (changes: FlowNodeChange[]) => {
    _onNodesChange(
      changes.filter(
        (change) => !(change.type === "remove" && change.id === "root")
      )
    );
    setDirty(true);
  };

  const onEdgesChange = (changes: FlowEdgeChange[]) => {
    _onEdgesChange(changes);
    setDirty(true);
  };

  const onChange =
    <T,>(name: string) =>
    (id: string, value: T) =>
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, [name]: value } } : n
        )
      );

  const onUpdate =
    <T,>(types: string[], name: string) =>
    (value: T) =>
      setNodes((nodes) =>
        nodes.map((node) =>
          types.includes(node.type)
            ? { ...node, data: { ...node.data, [name]: value } }
            : node
        )
      );

  const onChangeLayerId = onChange<string>("id");
  const onChangeLayerOpacity = onChange<number>("opacity");
  const onChangeLayerBlending = onChange<string>("blending");
  const onChangeBundleName = onChange<string>("name");
  const onChangeBundleIds = onChange<string[]>("ids");
  const onChangeBundlePrice = onChange<number>("price");

  const onUpdateUrls = onUpdate<Record<string, string>>(["layerNode"], "urls");
  const onUpdateComposedUrls = onUpdate<Record<string, string>>(
    ["renderNode", "bundleNode", "notRevealedNode"],
    "composedUrls"
  );
  const onUpdateRenderIds = onUpdate<Record<string, string>>(
    ["renderNode", "bundleNode", "notRevealedNode"],
    "renderIds"
  );
  const onUpdateNs = onUpdate<Record<string, number>>(
    ["renderNode", "bundleNode"],
    "ns"
  );
  const onUpdateMaxNs = onUpdate<Record<string, number>>(
    ["renderNode"],
    "maxNs"
  );
  const onUpdateIgnored = onUpdate<string[]>(
    ["renderNode", "bundleNode"],
    "ignored"
  );
  const onUpdatePrices = onUpdate<Record<string, number>>(
    ["renderNode", "bundleNode"],
    "prices"
  );

  const requestUrl = async (trait: Trait) => {
    const key = hash(trait);
    const base64String = await factoryGetTraitImage(id, trait, MAX_SIZE);
    setUrls((prevUrls) => {
      const newUrls = {
        ...prevUrls,
        [key]: `data:image/png;base64,${base64String}`,
      };
      onUpdateUrls(newUrls);
      return newUrls;
    });
  };

  const requestComposedUrl = async (traits: Trait[]) => {
    const key = hash(traits);
    const composedBase64String = await factoryComposeTraits(
      id,
      traits,
      MAX_SIZE
    );

    setComposedUrls((prevComposedUrls) => {
      const newComposedUrls = {
        ...prevComposedUrls,
        [key]: `data:image/png;base64,${composedBase64String}`,
      };
      onUpdateComposedUrls(newComposedUrls);
      return newComposedUrls;
    });
  };

  const requestRenderId = async (traits: Trait[]) => {
    const key = hash(traits);
    const renderId = dashedName();
    setRenderIds((prevRenderIds) => {
      const newRenderIds = { ...prevRenderIds, [key]: renderId };
      onUpdateRenderIds(newRenderIds);
      return newRenderIds;
    });
  };

  const requestMaxNs = async (traits: Trait[]) => {
    const key = hash(traits);
    const maxNs = await factoryComputeMaxCombinations(id, traits);

    setMaxNs((prevMaxNs) => {
      const newMaxNs = { ...prevMaxNs, [key]: maxNs };
      onUpdateMaxNs(newMaxNs);
      return newMaxNs;
    });
  };

  const updateNs = async (traits: Trait[], n: number) => {
    const key = hash(traits);
    setNs((prevNs) => {
      const newNs = { ...prevNs, [key]: n };
      onUpdateNs(newNs);
      return newNs;
    });
  };

  const updateIgnored = async (traits: Trait[], ignored: boolean) => {
    const key = hash(traits);
    setIgnored((prevIgnored) => {
      const newIgnored = ignored
        ? [...prevIgnored, key]
        : prevIgnored.filter((k) => k !== key);
      onUpdateIgnored(newIgnored);
      return newIgnored;
    });
  };

  const updatePrices = async (traits: Trait[], price: number) => {
    const key = hash(traits);
    setPrices((prevPrices) => {
      const newPrices = { ...prevPrices, [key]: price };
      onUpdatePrices(newPrices);
      return newPrices;
    });
  };

  const onConnect = useCallback(
    (connection: FlowConnection) =>
      setEdges((eds) =>
        addEdge(
          { ...connection, type: "customEdge", data: { onEdgeRemove } },
          eds
        )
      ),
    [setEdges]
  );

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (event: React.DragEvent) => {
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

  const onEdgeRemove = (id: string) =>
    setEdges((es) => es.filter((e) => e.id !== id));

  const onInit = setReactFlowInstance;

  const makeData = async (type: string, name: string) => {
    switch (type) {
      case "layerNode":
        return {
          urls,
          requestUrl,
          onChangeLayerId,
          onChangeLayerOpacity,
          onChangeLayerBlending,

          trait: traits[layers.findIndex((e: string) => e === name)],
          id: dashedName(),
          name,
          opacity: DEFAULT_OPACITY,
          blending: DEFAULT_BLENDING,
        } as LayerNodeComponentData;
      case "renderNode":
        return {
          composedUrls,
          renderIds,
          ns,
          maxNs,
          ignored,
          prices,

          requestComposedUrl,
          requestRenderId,
          requestMaxNs,
          updateNs,
          updateIgnored,
          updatePrices,
        } as RenderNodeComponentData;
      case "bundleNode":
        return {
          composedUrls,
          renderIds,
          ns,
          prices,
          ignored,
          onChangeBundleName,
          onChangeBundleIds,
          onChangeBundlePrice,

          name: spacedName(),
          ids: null,
          price: DEFAULT_PRICE,
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
    const data = await makeData(type, name);

    return {
      id,
      type,
      position,
      data,
    };
  };

  const hydrateNodeData = (type: string, data: any): any => {
    switch (type) {
      case "layerNode":
        return {
          ...data,

          urls,
          requestUrl,
          onChangeLayerId,
          onChangeLayerOpacity,
          onChangeLayerBlending,

          trait: traits[layers.findIndex((e: string) => e === data.name)],
        } as LayerNodeComponentData;
      case "renderNode":
        return {
          ...data,

          composedUrls,
          renderIds,
          ns,
          maxNs,
          ignored,
          prices,

          requestComposedUrl,
          requestRenderId,
          requestMaxNs,
          updateNs,
          updateIgnored,
          updatePrices,
        } as RenderNodeComponentData;
      case "bundleNode":
        return {
          ...data,

          composedUrls,
          renderIds,
          ns,
          ignored,
          prices,
          onChangeBundleName,
          onChangeBundleIds,
          onChangeBundlePrice,
        } as BundleNodeComponentData;
      default:
        return data;
    }
  };

  const hydrateNodes = (nodes: FlowNode[]): FlowNode[] =>
    nodes.map((node) => ({
      ...node,
      data: hydrateNodeData(node.type, node.data),
    }));

  const hydrateEdgeDate = (type: string, data: any): any => {
    switch (type) {
      case "customEdge":
        return {
          ...data,
          onEdgeRemove,
        };
      default:
        return data;
    }
  };

  const hydrateEdges = (edges: FlowEdge[]): FlowEdge[] =>
    edges.map((edge) => ({
      ...edge,
      data: hydrateEdgeDate(edge.type, edge.data),
    }));

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
  layers,
  children,
  traits,
  setter,

  initialNodes,
  initialEdges,
  initialRenderIds,
  initialNs,
  initialIgnored,
  initialPrices,

  setDirty,
}) => {
  const value = useNodes(
    id,
    layers,
    traits,
    setter,
    initialNodes,
    initialEdges,
    initialRenderIds,
    initialNs,
    initialIgnored,
    initialPrices,
    setDirty
  );

  return (
    <NodesContext.Provider value={value}>
      {autoPlace && <Nodes />}
      {children}
    </NodesContext.Provider>
  );
};
