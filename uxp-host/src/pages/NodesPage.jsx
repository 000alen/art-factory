import React, { useState, useContext, useEffect } from "react";
import { Sidebar } from "../components/NodesPageSidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Flex, ButtonGroup, ProgressBar } from "@adobe/react-spectrum";
import { factoryGetRandomTraitImage } from "../ipc";
import { GenericDialogContext } from "../components/GenericDialog";
import { computeN, factoryGenerate, filterNodes } from "../actions";
import { getId, Nodes, NodesContextProvider } from "../components/NodesContext";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import { ToolbarContext } from "../components/Toolbar";
import { TriStateButton } from "../components/TriStateButton";

export function NodesPage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const toolbarContext = useContext(ToolbarContext);
  const { task, isWorking } = useErrorHandler(genericDialogContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    id,
    inputDir,
    outputDir,
    photoshopId,
    photoshop,
    partialConfiguration,
  } = state;

  const [elements, setElements] = useState([]);

  const [buffers, setBuffers] = useState([]);
  const [urls, setUrls] = useState([]);
  const [n, setN] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [configuration, setConfiguration] = useState(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));

    Promise.all(
      partialConfiguration.layers.map(
        async (layer) => await factoryGetRandomTraitImage(id, layer, 500)
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
            id: getId(),
            type: "layerNode",
            sourcePosition: "right",
            targetPosition: "left",
            data: { layer, buffer: buffers[i], url: urls[i] },
            position: { x: 250 * (i + 1), y: 100 * i },
          })),
        ]);

        setBuffers(buffers);
        setUrls(urls);
      });
    return () => {
      toolbarContext.removeButton("close");
    };
  }, [id, partialConfiguration.layers]);

  const onProgress = (i) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = task("generation", async () => {
    const layersNodes = filterNodes(elements);
    const n = computeN(layersNodes);
    const configuration = {
      ...partialConfiguration,
      n,
      layersNodes,
    };

    setN(n);
    setConfiguration(configuration);

    const { attributes } = await factoryGenerate(
      id,
      configuration,
      layersNodes,
      onProgress
    );

    setAttributes(attributes);
    setGenerationDone(true);
  });

  const onContinue = () => {
    navigate("/quality", {
      state: {
        id,
        attributes,
        inputDir,
        outputDir,
        photoshopId,
        photoshop,
        configuration,
      },
    });
  };

  return (
    <NodesContextProvider
      autoPlace={false}
      elements={elements}
      setElements={setElements}
      buffers={buffers}
      urls={urls}
      partialConfiguration={partialConfiguration}
    >
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar
          layers={partialConfiguration.layers}
          buffers={buffers}
          urls={urls}
        />
        <Nodes>
          <div className="absolute z-10 bottom-4 right-4">
            <TriStateButton
              preLabel="Generate"
              preAction={onGenerate}
              loading={isWorking}
              loadingDone={generationDone}
              loadingLabel="Generating…"
              loadingMaxValue={n}
              loadingValue={currentGeneration}
              postLabel="Continue"
              postAction={onContinue}
            />
          </div>
        </Nodes>
      </div>
    </NodesContextProvider>
  );
}
