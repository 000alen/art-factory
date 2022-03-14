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
} from "react-flow-renderer";
import { SwitchNode } from "./SwitchNode";

let id = 0;
export const getId = () => `${id++}`;

const nodeTypes = {
  rootNode: RootNode,
  layerNode: LayerNode,
  renderNode: RenderNode,
  switchNode: SwitchNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

const allPaths = (elements) => {
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
    const actualNode = stack.pop();

    if (actualNode.node.type === "renderNode") {
      savedPaths.push(actualNode.path);
    } else {
      const neighbors = getOutgoers(actualNode.node, elements);

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
  elements,
  setElements,
  partialConfiguration,
  buffers,
  urls
) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onChangeN = (id, n) => {
    setElements((els) =>
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

  const onChangeOpacity = (id, opacity) => {
    setElements((els) =>
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

  const onChangeBlending = (id, blending) => {
    setElements((els) =>
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
    setElements((els) => {
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
        const buffers = path.map((node) => node.data.buffer);
        const urls = path.map((node) => node.data.url);
        toUpdate[render.id] = [buffers, urls];
      });

      els = els.map((el) =>
        el.id in toUpdate
          ? {
              ...el,
              data: {
                ...el.data,
                connected: true,
                buffers: toUpdate[el.id][0],
                urls: toUpdate[el.id][1],
              },
            }
          : el
      );

      return els;
    });
  };

  const onConnect = (params) => {
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

  const onElementsRemove = (elementsToRemove) => {
    setElements((els) => removeElements(elementsToRemove, els));
    updatePreview();
  };

  const onEdgeRemove = (id) => {
    onElementsRemove([{ id }]);
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
    const { type, layer } = JSON.parse(
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
              layer,
              buffer:
                buffers[
                  partialConfiguration.layers.findIndex((e) => e === layer)
                ],
              url: urls[
                partialConfiguration.layers.findIndex((e) => e === layer)
              ],
              opacity: 1, // Default opacity
              blending: "normal", // Default blending
              onChangeOpacity: (opacity) => onChangeOpacity(id, opacity),
              onChangeBlending: (blending) => onChangeBlending(id, blending),
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
              onChangeN: (n) => onChangeN(id, n),
            },
          }
        : type === "switchNode"
        ? {
            id,
            type,
            sourcePosition: "right",
            targetPosition: "left",
            position,
            data: {
              layers: partialConfiguration.layers,
              buffers,
              urls,
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
  onChangeN: (id, n) => {},
  onChangeOpacity: (id, opacity) => {},
  onChangeBlending: (id, blending) => {},
  updatePreview: () => {},
  onConnect: (params) => {},
  onElementsRemove: (elementsToRemove) => {},
  onEdgeRemove: (id) => {},
  onLoad: (_reactFlowInstance) => {},
  onDragOver: (event) => {},
  onDrop: (event) => {},
});

export function Nodes({ children }) {
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
        <Background variant="dots" gap={50} />
        {children}
      </ReactFlow>
    </div>
  );
}

export function NodesContextProvider({
  autoPlace = true,
  elements,
  setElements,
  partialConfiguration,
  buffers,
  urls,
  children,
}) {
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
}
