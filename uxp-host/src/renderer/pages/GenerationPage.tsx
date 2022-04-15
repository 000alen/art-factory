import { Flex, Heading, Text, TextField } from "@adobe/react-spectrum";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import {
  BundlesInfo,
  CollectionItem,
  Instance,
  MetadataItem,
} from "../typings";
import Back from "@spectrum-icons/workflow/Back";
import Close from "@spectrum-icons/workflow/Close";
import { getBranches } from "../nodesUtils";
import { LayerNodeComponentData } from "../components/LayerNode";
import { Trait } from "../typings";
import {
  factoryMakeGeneration,
  factoryGenerateImages,
  factoryGenerateMetadata,
  factoryGetImage,
} from "../ipc";
import { hash, spacedName } from "../utils";
import { Node as FlowNode } from "react-flow-renderer";
import { v4 as uuid } from "uuid";
import { TriStateButton } from "../components/TriStateButton";
import { ArrayOf } from "../components/ArrayOf";
import { MetadataField } from "../components/MetadataField";
import { ImageItem } from "../components/ImageItem";
import { generate } from "../commands";

interface GenerationPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  templateId: string;
  dirty: boolean;
}

// youtube_url
// animation_url
// background_color
// external_url

export const GenerationPage: React.FC = () => {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectDir,
    instance,
    id,
    templateId,
    dirty: _dirty,
  } = state as GenerationPageState;
  const { templates } = instance;

  const [dirty, setDirty] = useState(_dirty);

  const [templateName] = useState(
    templates.find((template) => template.id === templateId).name
  );

  const [name, setName] = useState(spacedName());
  const [collection, setCollection] = useState(null);
  const [bundles, setBundles] = useState(null);

  const [isWorking, setIsWorking] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [metadataItems, setMetadataItems] = useState<MetadataItem[]>([]);
  const [url, setUrl] = useState(null);
  const [currentGeneration, setCurrentGeneration] = useState(0);

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, []);

  const n = useMemo(() => {
    const { nodes, edges, ns, ignored } = templates.find(
      (nodes) => nodes.id === templateId
    );

    const nData = (
      getBranches(nodes, edges).map((branch) =>
        branch.slice(1, -1)
      ) as FlowNode<LayerNodeComponentData>[][]
    ).map((branch) => branch.map((node) => node.data));
    let keys = nData
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
        }))
      )
      .map(hash);

    keys = keys.filter((key) => !ignored.includes(key));
    return keys.reduce((acc, key) => ns[key] + acc, 0);
  }, []);

  const updateUrlThreshold = useMemo(() => Math.ceil(n / 3), []);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onProgress = async (n: string) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = task("generation", async () => {
    setIsWorking(true);

    const template = templates.find((nodes) => nodes.id === templateId);

    const a = performance.now();
    const { collection, bundles } = await generate(
      id,
      name,
      metadataItems,
      template,
      onProgress
    );
    const b = performance.now();

    console.log(b - a);

    setCollection(collection);
    setBundles(bundles);

    setIsWorking(false);
    setGenerationDone(true);
  });

  const onSave = () => {
    let generations = [
      ...instance.generations,
      { id: uuid(), name, collection, bundles },
    ];

    generations = JSON.parse(JSON.stringify(generations));

    navigate("/factory", {
      state: {
        projectDir,
        instance: { ...instance, generations },
        id,
        dirty,
      },
    });
  };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <TextField label="Name" value={name} onChange={setName} />

      <Flex height="60vh" gap="size-100" justifyContent="space-evenly">
        <Flex direction="column" justifyContent="center" alignItems="center">
          <Heading>{templateName}</Heading>
          <Text>{n}</Text>
          <ImageItem src={url} />
        </Flex>

        <ArrayOf
          Component={MetadataField}
          label="Metadata"
          heading={true}
          emptyValue={{ key: "", value: "" }}
          items={metadataItems}
          setItems={setMetadataItems}
        >
          <Text>
            * <code>{"${name}"}</code> will get replaced with the name of the
            item
          </Text>
        </ArrayOf>
      </Flex>

      <TriStateButton
        preLabel="Generate"
        preAction={onGenerate}
        loading={isWorking}
        loadingDone={generationDone}
        loadingLabel="Generating…"
        loadingMaxValue={n}
        loadingValue={currentGeneration}
        postLabel="Save"
        postAction={onSave}
      />
    </Flex>
  );
};
