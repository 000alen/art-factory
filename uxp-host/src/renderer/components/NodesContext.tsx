import React, { useCallback, useEffect } from "react";
import { createContext, useState, useContext, useRef } from "react";
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  Node as FlowNode,
  Edge as FlowEdge,
  Connection as FlowConnection,
  NodeChange as FlowNodeChange,
  EdgeChange as FlowEdgeChange,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
} from "react-flow-renderer";
import { Configuration, Trait } from "../typings";
import { dashedName, getId, hash, spacedName } from "../utils";
import {
  DEFAULT_BLENDING,
  DEFAULT_NODES,
  DEFAULT_OPACITY,
  EDGE_TYPES,
  MAX_SIZE,
  NODE_TYPES,
} from "../constants";
import { factoryComposeTraits, factoryGetTraitImage } from "../ipc";
import { LayerNodeComponentData } from "./LayerNode";
import { RenderNodeComponentData } from "./RenderNode";
import { BundleNodeComponentData } from "./BundleNode";

interface NodesContextProviderProps {
  id: string;
  autoPlace?: boolean;
  partialConfiguration: Partial<Configuration>;
  traits: Trait[];
  setter: (getter: () => NodesInstance) => void;
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
}

export function useNodes(
  id: string,
  partialConfiguration: Partial<Configuration>,
  traits: Trait[],
  setter: (getter: () => NodesInstance) => void
) {
  const reactFlowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, _onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onNodesChange = (changes: FlowNodeChange[]) =>
    _onNodesChange(
      changes.filter(
        (change) => !(change.type === "remove" && change.id === "root")
      )
    );

  // TODO
  // // ? name -> dashedName[]
  // const layersIds = useMap<string, string[]>();

  // ? hash(trait) -> url
  const [urls, setUrls] = useState<Record<string, string>>({});

  // ? hash(trait[]) -> url
  const [composedUrls, setComposedUrls] = useState<Record<string, string>>({});

  // ? hash(trait[]) -> dashedName
  const [renderIds, setRenderIds] = useState<Record<string, string>>({});

  // ? hash(trait[]) -> number
  const [ns, setNs] = useState<Record<string, number>>({});

  const [ignored, setIgnored] = useState<string[]>([]);

  useEffect(() => {
    setter(() => ({
      nodes,
      edges,
      urls,
      composedUrls,
      renderIds,
      ns,
      ignored,
    }));
  }, [setter, nodes, edges, urls, composedUrls, renderIds, ns, ignored]);

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

  const onUpdateUrls = onUpdate<Record<string, string>>(["layerNode"], "urls");
  const onUpdateComposedUrls = onUpdate<Record<string, string>>(
    ["renderNode", "bundleNode"],
    "composedUrls"
  );
  const onUpdateRenderIds = onUpdate<Record<string, string>>(
    ["renderNode", "bundleNode"],
    "renderIds"
  );
  const onUpdateNs = onUpdate<Record<string, number>>(
    ["renderNode", "bundleNode"],
    "ns"
  );
  const onUpdateIgnored = onUpdate<string[]>(
    ["renderNode", "bundleNode"],
    "ignored"
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

          trait:
            traits[
              partialConfiguration.layers.findIndex((e: string) => e === name)
            ],
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
          ignored,

          requestComposedUrl,
          requestRenderId,
          updateNs,
          updateIgnored,
        } as RenderNodeComponentData;
      case "bundleNode":
        return {
          composedUrls,
          renderIds,
          ns,
          ignored,
          onChangeBundleName,
          onChangeBundleIds,

          name: spacedName(),
          ids: null,
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
  setter,
}) => {
  const value = useNodes(id, partialConfiguration, traits, setter);

  return (
    <NodesContext.Provider value={value}>
      {autoPlace && <Nodes />}
      {children}
    </NodesContext.Provider>
  );
};
