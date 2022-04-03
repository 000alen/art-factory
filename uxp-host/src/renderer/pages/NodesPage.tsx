import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Sidebar } from "../components/NodesPageSidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { factoryGetLayerByName, factoryGetRandomTraitImage } from "../ipc";
import { factoryGenerate } from "../actions";
import {
  Nodes,
  NodesContextProvider,
  NodesInstance,
} from "../components/NodesContext";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import { ToolbarContext } from "../components/Toolbar";
import { TriStateButton } from "../components/TriStateButton";
import { Configuration, Trait } from "../typings";
import { MAX_SIZE } from "../constants";
import { getBranches } from "../nodesUtils";
import { LayerNodeComponentData } from "../components/LayerNode";
import { Node as FlowNode } from "react-flow-renderer";
import { hash } from "../utils";

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

  const [traits, setTraits] = useState([]);
  const [n, setN] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const [collection, setCollection] = useState([]);
  const [bundles, setBundles] = useState({});
  const [configuration, setConfiguration] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workTime, setWorkTime] = useState(null);
  const getterRef = useRef<() => NodesInstance>(null);

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

      const traits: Trait[] = traitsAndBase64Strings.map(([trait]) => trait);
      setTraits(traits);
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

    const { nodes, edges, ns } = getterRef.current();

    const nData = (
      getBranches(nodes, edges).map((branch) =>
        branch.slice(1, -1)
      ) as FlowNode<LayerNodeComponentData>[][]
    ).map((branch) => branch.map((node) => node.data));

    const keys = nData
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
        }))
      )
      .map(hash);

    const nTraits: Trait[][] = nData.map((branch) =>
      branch.map((data) => ({
        ...data.trait,
        id: data.id,
        opacity: data.opacity,
        blending: data.blending,
      }))
    );

    const nBundles = nodes
      .filter((node) => node.type === "bundleNode")
      .map((node) => node.data)
      .map((data) => ({
        name: data.name,
        ids: data.ids,
      }));

    const n = keys.reduce((acc, key) => ns[key] + acc, 0);
    const configuration = partialConfiguration;

    setN(n);
    setConfiguration(configuration);

    const a = performance.now();

    const { collection, bundles } = await factoryGenerate(
      id,
      configuration,
      keys,
      nTraits,
      ns,
      nBundles,
      onProgress
    );

    const b = performance.now();

    console.log(collection, bundles);

    setWorkTime(b - a);
    setCollection(collection);
    setBundles(bundles);
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

  const setter = useCallback(
    (getter: () => any) => (getterRef.current = getter),
    []
  );

  return (
    <NodesContextProvider
      id={id}
      autoPlace={false}
      partialConfiguration={partialConfiguration}
      traits={traits}
      setter={setter}
    >
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar id={id} layers={partialConfiguration.layers} traits={traits} />
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
