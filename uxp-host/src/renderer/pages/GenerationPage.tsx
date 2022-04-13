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
  factoryGenerateCollection,
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

interface GenerationPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  templateId: string;
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
  const { projectDir, instance, id, templateId } = state as GenerationPageState;
  const { configuration, templates } = instance;

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
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", { state: { projectDir, instance, id } })
    );

    return () => {
      toolbarContext.removeButton("close");
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

  const onProgress = async (n: string) => {
    const updateUrl = async () =>
      setUrl(
        `data:image/png;base64,${await factoryGetImage(id, name, {
          name: n,
        } as CollectionItem)}`
      );

    setCurrentGeneration((prevGeneration) => {
      if (prevGeneration % updateUrlThreshold === 0) updateUrl();
      return prevGeneration + 1;
    });
  };

  const onGenerate = task("generation", async () => {
    setIsWorking(true);

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

    const nTraits: Trait[][] = nData
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
          opacity: data.opacity,
          blending: data.blending,
        }))
      )
      .filter((_, i) => !ignored.includes(keys[i]));

    keys = keys.filter((key) => !ignored.includes(key));

    const bundlesInfo: BundlesInfo = nodes
      .filter((node) => node.type === "bundleNode")
      .map((node) => node.data)
      .map((data) => ({
        name: data.name,
        ids: data.ids,
      }));

    const a = performance.now();
    const { collection, bundles } = await factoryGenerateCollection(
      id,
      keys,
      nTraits,
      ns,
      bundlesInfo
    );
    await factoryGenerateImages(id, name, collection, onProgress);
    await factoryGenerateMetadata(id, name, collection, metadataItems);
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
      <TextField
        marginStart={16}
        label="Name"
        value={name}
        onChange={setName}
      />

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
