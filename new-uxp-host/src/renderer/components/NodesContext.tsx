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
} from "react-flow-renderer";
import { BundleNode } from "./BundleNode";

interface NodesContextProviderProps {
  autoPlace?: boolean;
  elements: any[];
  setElements: any;
  partialConfiguration: any;
  buffers: any[];
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

const allPaths = (elements: any[]) => {
  const root = elements
    .filter((element) => element.type === "rootNode")
    .shift();

  const stack = [];
  stack.push({
    node: root,
    path: [root],
  });

  const savedPaths = [];
  while (stack.length > 0) {
    // @ts-ignore
    const actualNode = stack.pop();

    if (actualNode.node.type === "renderNode") {
      savedPaths.push(actualNode.path);
    } else {
      // @ts-ignore
      const neighbors = getOutgoers(actualNode.node, elements);
      // @ts-ignore
      for (const v of neighbors) {
        stack.push({
          node: v,
          path: [...actualNode.path, v],
        });
      }
    }
  }

  return savedPaths.map((path) => path.slice(1));
};

export function useNodes(
  elements: any[],
  setElements: (elements: any[] | ((prevElements: any[]) => any[])) => void,
  partialConfiguration: any,
  buffers: any[],
  urls: string[]
) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onChangeN = (id: string, n: number) => {
    // @ts-ignore
    setElements((els) =>
      // @ts-ignore
      els.map((el) =>
        el.id === id
          ? {
              ...el,
              data: { ...el.data, n },
            }
          : el
      )
    );
  };

  const onChangeOpacity = (id: string, opacity: number) => {
    // @ts-ignore
    setElements((els) =>
      // @ts-ignore
      els.map((el) =>
        el.id === id
          ? {
              ...el,
              data: { ...el.data, opacity },
            }
          : el
      )
    );
  };

  const onChangeBlending = (id: string, blending: string) => {
    // @ts-ignore
    setElements((els) =>
      // @ts-ignore
      els.map((el) =>
        el.id === id
          ? {
              ...el,
              data: { ...el.data, blending },
            }
          : el
      )
    );
  };

  const updatePreview = () => {
    // @ts-ignore
    setElements((els) => {
      // @ts-ignore
      els = els.map((el) =>
        el.type === "renderNode"
          ? {
              ...el,
              data: {
                ...el.data,
                connected: false,
                buffers: undefined,
                urls: undefined,
              },
            }
          : el
      );

      const toUpdate = {};

      allPaths(els).forEach((path) => {
        const render = path.pop();
        // @ts-ignore
        const buffers = path.map((node) => node.data.buffer);
        // @ts-ignore
        const urls = path.map((node) => node.data.url);
        // @ts-ignore
        toUpdate[render.id] = [buffers, urls];
      });
      // @ts-ignore

      els = els.map((el) =>
        el.id in toUpdate
          ? {
              ...el,
              data: {
                ...el.data,
                connected: true,
                // @ts-ignore
                buffers: toUpdate[el.id][0],
                // @ts-ignore
                urls: toUpdate[el.id][1],
              },
            }
          : el
      );

      return els;
    });
  };

  const onConnect = (params: any) => {
    setElements((els) => {
      if (
        params.sourceHandle === "bundleOut" &&
        params.targetHandle === "bundleIn"
      ) {
        return addEdge({ ...params, animated: true }, els);
      } else {
        return addEdge(
          { ...params, type: "customEdge", data: { onEdgeRemove } },
          els
        );
      }
    });
    updatePreview();
  };

  const onElementsRemove = (elementsToRemove: any[]) => {
    setElements((els) => removeElements(elementsToRemove, els));
    updatePreview();
  };

  const onEdgeRemove = (id: string) => {
    onElementsRemove([{ id }]);
  };

  const onLoad = (_reactFlowInstance: any) => {
    setReactFlowInstance(_reactFlowInstance);
  };

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: any) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const { type, name } = JSON.parse(
      event.dataTransfer.getData("application/reactflow")
    );

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const id = getId();

    const newNode =
      type === "layerNode"
        ? {
            id,
            type,
            sourcePosition: "right",
            targetPosition: "left",
            position,
            data: {
              name,
              buffer:
                buffers[
                  partialConfiguration.layers.findIndex(
                    (e: string) => e === name
                  )
                ],
              url: urls[
                partialConfiguration.layers.findIndex((e: string) => e === name)
              ],
              opacity: 1,
              blending: "normal",
              onChangeOpacity: (opacity: number) =>
                onChangeOpacity(id, opacity),
              onChangeBlending: (blending: string) =>
                onChangeBlending(id, blending),
            },
          }
        : type === "renderNode"
        ? {
            id,
            type,
            sourcePosition: "right",
            targetPosition: "left",
            position,
            data: {
              n: 1,
              onChangeN: (n: number) => onChangeN(id, n),
            },
          }
        : {
            id,
            type,
            sourcePosition: "right",
            targetPosition: "left",
            position,
          };

    setElements((es) => es.concat(newNode));
    updatePreview();
  };

  return {
    reactFlowWrapper,
    reactFlowInstance,
    elements,
    onChangeN,
    onChangeOpacity,
    onChangeBlending,
    updatePreview,
    onConnect,
    onElementsRemove,
    onEdgeRemove,
    onLoad,
    onDragOver,
    onDrop,
  };
}

export const NodesContext = createContext({
  reactFlowWrapper: null,
  reactFlowInstance: null,
  elements: [],
  onChangeN: (id: string, n: number) => {},
  onChangeOpacity: (id: string, opacity: number) => {},
  onChangeBlending: (id: string, blending: string) => {},
  updatePreview: () => {},
  onConnect: (params: any) => {},
  onElementsRemove: (elementsToRemove: any) => {},
  onEdgeRemove: (id: string) => {},
  onLoad: (_reactFlowInstance: any) => {},
  onDragOver: (event: any) => {},
  onDrop: (event: any) => {},
});

export const Nodes: React.FC = ({ children }) => {
  const {
    reactFlowWrapper,
    elements,
    onConnect,
    onElementsRemove,
    onLoad,
    onDragOver,
    onDrop,
  } = useContext(NodesContext);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        elements={elements}
        onConnect={onConnect}
        onElementsRemove={onElementsRemove}
        onLoad={onLoad}
        onDrop={onDrop}
        onDragOver={onDragOver}
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
  autoPlace = true,
  elements,
  setElements,
  partialConfiguration,
  buffers,
  urls,
  children,
}) => {
  const {
    reactFlowWrapper,
    reactFlowInstance,
    onChangeN,
    updatePreview,
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
        reactFlowWrapper,
        reactFlowInstance,
        elements,
        onChangeN,
        updatePreview,
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
