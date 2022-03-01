import React, { useState, useContext, useEffect } from "react";
import { Sidebar } from "../components/NodesPageSidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Flex, ButtonGroup, ProgressBar } from "@adobe/react-spectrum";
import { factoryGetRandomTraitImage } from "../ipc";
import { GenericDialogContext } from "../components/GenericDialog";
import { computeN, factoryGenerate, filterNodes } from "../actions";
import { Nodes, NodesContextProvider } from "../components/NodesContext";

export function NodesPage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id, inputDir, outputDir, photoshop, partialConfiguration } = state;

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
        ]);

        setBuffers(buffers);
        setUrls(urls);
      });
  }, [id, partialConfiguration.layers]);

  const onProgress = (i) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = async () => {
    setIsGenerating(true);
    const layersNodes = filterNodes(elements);
    const n = computeN(layersNodes);
    const configuration = {
      ...partialConfiguration,
      n,
      layersNodes,
    };
    setN(n);
    setConfiguration(configuration);
    let attributes;
    try {
      ({ attributes } = await factoryGenerate(
        id,
        configuration,
        layersNodes,
        onProgress
      ));
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }
    setAttributes(attributes);
    setIsGenerating(false);
    setGenerationDone(true);
  };

  const onContinue = () => {
    navigate("/quality", {
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
    <NodesContextProvider
      autoPlace={false}
      elements={elements}
      setElements={setElements}
      buffers={buffers}
      urls={urls}
    >
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar
          layers={partialConfiguration.layers}
          buffers={buffers}
          urls={urls}
        />
        <Nodes>
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
        </Nodes>
      </div>
    </NodesContextProvider>
  );
}
