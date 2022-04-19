import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import {
  Flex,
  Heading,
  NumberField,
  Text,
  TextField,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";

import { computeTemplateN, generate, getTemplatePreview } from "../commands";
import { ArrayOf } from "../components/ArrayOf";
import { useErrorHandler } from "../components/ErrorHandler";
import { ImageItem } from "../components/ImageItem";
import { MetadataField } from "../components/MetadataField";
import { ToolbarContext } from "../components/Toolbar";
import { TriStateButton } from "../components/TriStateButton";
import { Instance, MetadataItem } from "../typings";
import { spacedName } from "../utils";
import moment from "moment";
import { METADATA_FIELDS } from "../constants";
import { Preview } from "../components/Preview";

interface GenerationPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  templateId: string;
  dirty: boolean;
}

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
  const { configuration, templates } = instance;

  const [dirty, setDirty] = useState(_dirty);

  const [template] = useState(
    templates.find((template) => template.id === templateId)
  );

  const [price, setPrice] = useState(configuration.cost);
  const [name, setName] = useState(spacedName());
  const [collection, setCollection] = useState(null);
  const [bundles, setBundles] = useState(null);

  const [isWorking, setIsWorking] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [metadataItems, setMetadataItems] = useState<MetadataItem[]>([]);
  const [url, setUrl] = useState<string>(null);
  const [n, setN] = useState<number>(null);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState<string>(null);

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, []);

  useEffect(() => {
    task("preview", async () => {
      setUrl(
        await getTemplatePreview(
          id,
          templates.find((template) => template.id === templateId)
        )
      );
      setN(
        await computeTemplateN(
          templates.find((nodes) => nodes.id === templateId)
        )
      );
    })();
  }, []);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onProgress = async () => setCurrentGeneration((p) => p + 1);

  const onGenerate = task("generation", async () => {
    setIsWorking(true);

    const start = moment(performance.now());
    const { collection, bundles } = await generate(
      id,
      name,
      metadataItems,
      template,
      onProgress
    );
    const end = moment(performance.now());
    const diff = end.diff(start);

    setElapsedTime(moment.utc(diff).format("HH:mm:ss.SSS"));
    setCollection(collection);
    setBundles(bundles);
    setDirty(true);
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
          <Preview name={template.name} url={url} />
        </Flex>

        <Flex direction="column" gap="size-100">
          <Heading>Collection configuration</Heading>
          <NumberField
            label="Price"
            value={price}
            onChange={setPrice}
            minValue={0.01}
            step={0.01}
          />
        </Flex>

        <ArrayOf
          Component={MetadataField}
          label="Metadata"
          heading={true}
          emptyValue={{ key: METADATA_FIELDS[0], value: "" }}
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
        postLabel={`${dirty ? "* " : ""}Save`}
        postAction={onSave}
        postTooltip={true}
        postTooltipHeading="Elapsed time"
        postTooltipText={elapsedTime}
      />
    </Flex>
  );
};
