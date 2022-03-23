import React, { useState, useContext, useEffect } from "react";
import { Sidebar } from "../components/NodesPageSidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { factoryGetLayerByName, factoryGetRandomTraitImage } from "../ipc";
import { computeN, factoryGenerate, filterNodes } from "../actions";
import { Nodes, NodesContextProvider } from "../components/NodesContext";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import { ToolbarContext } from "../components/Toolbar";
import { TriStateButton } from "../components/TriStateButton";
import { Configuration } from "../typings";

interface NodesPageState {
  id: string;
  inputDir: string;
  outputDir: string;
  photoshopId: string;
  photoshop: boolean;
  partialConfiguration: Partial<Configuration>;
}

export function NodesPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    id,
    inputDir,
    outputDir,
    photoshopId,
    photoshop,
    partialConfiguration,
  } = state as NodesPageState;

  const [elements, setElements] = useState([]);

  const [buffers, setBuffers] = useState([]);
  const [urls, setUrls] = useState([]);
  const [n, setN] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const [collection, setCollection] = useState([]);
  const [configuration, setConfiguration] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));

    task("loading preview", async () => {
      const layers = await Promise.all(
        partialConfiguration.layers.map((layerName) =>
          factoryGetLayerByName(id, layerName)
        )
      );

      const buffers = await Promise.all(
        layers.map((layer) => factoryGetRandomTraitImage(id, layer, 500))
      );

      const urls = buffers.map((buffer) =>
        URL.createObjectURL(new Blob([buffer], { type: "image/png" }))
      );

      setElements([
        {
          id: "root",
          type: "rootNode",
          sourcePosition: "right",
          data: { label: "Root" },
          position: { x: 0, y: 0 },
        },
      ]);
      setBuffers(buffers);
      setUrls(urls);
    })();

    return () => {
      toolbarContext.removeButton("close");
    };
  }, [id, partialConfiguration.layers]);

  const onProgress = (name: string) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = task("generation", async () => {
    setIsWorking(true);
    const nodesAndEdges = filterNodes(elements);

    console.log(nodesAndEdges);

    const n = computeN(nodesAndEdges);
    const configuration = partialConfiguration;

    setN(n);
    setConfiguration(configuration);

    const { collection } = await factoryGenerate(
      id,
      configuration,
      nodesAndEdges,
      onProgress
    );

    setCollection(collection);
    setGenerationDone(true);
    setIsWorking(false);
  });

  const onContinue = task("continue", async () => {
    navigate("/quality", {
      state: {
        id,
        collection,
        inputDir,
        outputDir,
        photoshopId,
        photoshop,
        configuration,
      },
    });
  });

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
