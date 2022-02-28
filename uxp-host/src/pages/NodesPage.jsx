import React, { useState, useRef, useEffect, useContext } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  removeElements,
  Controls,
  Background,
  getOutgoers,
} from "react-flow-renderer";
import { Sidebar } from "../components/NodesPageSidebar";
import { DialogContext } from "../App";
import { useLocation, useNavigate } from "react-router-dom";
import { LayerNode } from "../components/LayerNode";
import { Button, Flex, ButtonGroup, ProgressBar } from "@adobe/react-spectrum";
import { RenderNode } from "../components/RenderNode";
import {
  factoryGenerateRandomAttributesFromNodes,
  factoryGetRandomTraitImage,
  factorySaveInstance,
  factorySetProps,
  factoryGenerateImages,
} from "../ipc";
import { RootNode } from "../components/RootNode";

let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  rootNode: RootNode,
  layerNode: LayerNode,
  renderNode: RenderNode,
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
    const neighbors = getOutgoers(actualNode.node, elements);

    // Leaf node
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
};

export function NodesPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, inputDir, outputDir, photoshop, partialConfiguration } = state;

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [elements, setElements] = useState([]);
  const [buffers, setBuffers] = useState([]);
  const [urls, setUrls] = useState([]);
  const [n, setN] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [isGenrating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [configuration, setConfiguration] = useState(null);

  useEffect(() => {
    Promise.all(
      partialConfiguration.layers.map(
        async (layer) => await factoryGetRandomTraitImage(id, layer)
      )
    )
      .then((buffers) => [
        buffers,
        buffers.map((buffer) =>
          URL.createObjectURL(new Blob([buffer], { type: "image/png" }))
        ),
      ])
      .then(([buffers, urls]) => {
        setElements([
          {
            id: "root",
            type: "rootNode",
            sourcePosition: "right",
            data: { label: "Root" },
            position: { x: 0, y: 0 },
          },
          ...partialConfiguration.layers.map((layer, i) => ({
            id: (i + 2).toString(),
            type: "layerNode",
            sourcePosition: "right",
            targetPosition: "left",
            data: { layer, buffer: buffers[i], url: urls[i] },
            position: { x: 250 * (i + 1), y: 100 * i },
          })),
          {
            id: "-1",
            type: "renderNode",
            targetPosition: "left",
            data: { n: 1, onChange: (n) => onChangeN("-1", n) },
            position: { x: 0, y: 100 },
          },
        ]);

        setBuffers(buffers);
        setUrls(urls);
      });
  }, [id, partialConfiguration.layers]);

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

  const updatePreview = () => {
    setElements((els) => {
      const toUpdate = {};

      allPaths(els)
        .map((path) => path.slice(1))
        .forEach((path) => {
          const render = path.pop();
          const buffers = path.map((node) => node.data.buffer);
          const urls = path.map((node) => node.data.url);
          toUpdate[render.id] = [buffers, urls];
        });

      return els.map((el) =>
        el.id in toUpdate
          ? {
              ...el,
              data: {
                ...el.data,
                buffers: toUpdate[el.id][0],
                urls: toUpdate[el.id][1],
              },
            }
          : el
      );
    });
  };

  const onConnect = (params) => {
    setElements((els) => addEdge(params, els));
    updatePreview();
  };

  const onElementsRemove = (elementsToRemove) => {
    setElements((els) => removeElements(elementsToRemove, els));
    updatePreview();
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
              onChange: (n) => onChangeN(id, n),
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

  const onProgress = (i) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = async () => {
    setIsGenerating(true);

    const filteredElements = elements.map((element) =>
      element.type === "renderNode"
        ? {
            id: element.id,
            type: element.type,
            targetPosition: element.targetPosition,
            data: { n: element.data.n },
            position: element.position,
          }
        : element.type === "layerNode"
        ? {
            id: element.id,
            type: element.type,
            sourcePosition: element.sourcePosition,
            targetPosition: element.targetPosition,
            data: {
              layer: element.data.layer,
            },
            position: element.position,
          }
        : element
    );

    const _n = filteredElements.reduce(
      (e, a) => (e.type === "renderNode" ? a + e.data.n : a),
      0
    );

    setN(_n);

    const _configuration = {
      ...partialConfiguration,
      layersNodes: filteredElements,
    };

    setConfiguration(_configuration);

    let _attributes;

    try {
      await factorySetProps(id, {
        configuration: _configuration,
      });
      await factorySaveInstance(id);

      _attributes = await factoryGenerateRandomAttributesFromNodes(
        id,
        filteredElements
      );

      await factoryGenerateImages(id, _attributes, onProgress);
      await factorySaveInstance(id);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    setAttributes(_attributes);
    setIsGenerating(false);
    setGenerationDone(true);
  };

  const onContinue = () => {
    navigator("/quality", {
      state: {
        id,
        attributes,
        inputDir,
        outputDir,
        photoshop,
        configuration,
      },
    });
  };

  return (
    <div className="w-full h-full flex overflow-hidden">
      <ReactFlowProvider>
        <Sidebar
          layers={partialConfiguration.layers}
          buffers={buffers}
          urls={urls}
        />

        <div className="w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            elements={elements}
            onConnect={onConnect}
            onElementsRemove={onElementsRemove}
            onLoad={onLoad}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            deleteKeyCode={46}
          >
            <Controls />
            <Background variant="dots" gap={50} />

            <div className="absolute z-10 bottom-4 right-4">
              {isGenrating ? (
                <Flex marginBottom={8} marginX={8} justifyContent="end">
                  <ProgressBar
                    label="Generating…"
                    maxValue={n}
                    value={currentGeneration}
                  />
                </Flex>
              ) : (
                <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
                  {generationDone ? (
                    <Button variant="cta" onPress={onContinue}>
                      Continue!
                    </Button>
                  ) : (
                    <Button variant="cta" onPress={onGenerate}>
                      Generate!
                    </Button>
                  )}
                </ButtonGroup>
              )}
            </div>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
