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
import { Configuration, Trait } from "../typings";
import { MAX_SIZE } from "../constants";

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

  const [traits, setTraits] = useState([]);
  const [base64Strings, setBase64Strings] = useState([]);
  const [n, setN] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const [collection, setCollection] = useState([]);
  const [configuration, setConfiguration] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workTime, setWorkTime] = useState(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));

    task("loading preview", async () => {
      const layers = await Promise.all(
        partialConfiguration.layers.map((layerName) =>
          factoryGetLayerByName(id, layerName)
        )
      );

      const traitsAndBase64Strings = await Promise.all(
        layers.map((layer) => factoryGetRandomTraitImage(id, layer, MAX_SIZE))
      );
      const traits: Trait[] = [];
      const base64Strings: string[] = [];
      traitsAndBase64Strings.forEach(([trait, base64String]) => {
        traits.push(trait);
        base64Strings.push(base64String);
      });

      setElements([
        {
          id: "root",
          type: "rootNode",
          position: { x: 0, y: 0 },
        },
      ]);
      setTraits(traits);
      setBase64Strings(base64Strings);
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
    const n = computeN(nodesAndEdges); // ! TODO: This is not the correct way to compute n
    const configuration = partialConfiguration;

    setN(n);
    setConfiguration(configuration);

    const a = performance.now();
    const { collection } = await factoryGenerate(
      id,
      configuration,
      nodesAndEdges,
      onProgress
    );
    const b = performance.now();

    setWorkTime(b - a);
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
      id={id}
      autoPlace={false}
      elements={elements}
      setElements={setElements}
      partialConfiguration={partialConfiguration}
      traits={traits}
      base64Strings={base64Strings}
    >
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar
          id={id}
          layers={partialConfiguration.layers}
          traits={traits}
          base64Strings={base64Strings}
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
              loadingTime={workTime}
              postLabel="Continue"
              postAction={onContinue}
            />
          </div>
        </Nodes>
      </div>
    </NodesContextProvider>
  );
}
