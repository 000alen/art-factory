import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import {
    ActionButton, ActionGroup, Flex, Grid, Heading, Item, Menu, MenuTrigger, repeat, View
} from "@adobe/react-spectrum";
import Add from "@spectrum-icons/workflow/Add";
import Close from "@spectrum-icons/workflow/Close";
import Edit from "@spectrum-icons/workflow/Edit";
import Folder from "@spectrum-icons/workflow/Folder";
import Hammer from "@spectrum-icons/workflow/Hammer";
import SaveFloppy from "@spectrum-icons/workflow/SaveFloppy";
import Settings from "@spectrum-icons/workflow/Settings";

import {
    getGenerationPreview, getTemplatePreview, hydrateMetadata, reconstructGeneration,
    removeGeneration, save, unifyGenerations
} from "../commands";
import { ArrayOf } from "../components/ArrayOf";
import { useErrorHandler } from "../components/ErrorHandler";
import { Loading } from "../components/Loading";
import { Preview } from "../components/Preview";
import { CustomField, TaskItem } from "../components/TaskItem";
import { useToolbar } from "../components/Toolbar";
import { UXPContext } from "../components/UXPContext";
import {
    createFactory, factoryReloadConfiguration, factoryReloadLayers, hasFactory, openInExplorer, XXX
} from "../ipc";
import { Instance, PolygonNetwork, SourceItem } from "../typings";
import { makeSource } from "../utils";

interface FactoryPageState {
  projectDir: string;
  id: string;
  instance: Instance;
  dirty: boolean;
}

interface GenerationItemProps {
  value: string;
  onChange: (value: string) => void;
}

export const FactoryPage: React.FC = () => {
  useToolbar([
    {
      key: "close",
      label: "Close",
      icon: <Close />,
      onClick: () => navigate("/"),
    },
    {
      key: "open-explorer",
      label: "Open in Explorer",
      icon: <Folder />,
      onClick: () => openInExplorer(projectDir),
    },
  ]);

  const uxpContext = useContext(UXPContext);
  const navigate = useNavigate();

  const { state } = useLocation();
  const { projectDir, id, instance, dirty: _dirty } = state as FactoryPageState;

  const [configuration] = useState(instance.configuration);
  const [templates, setTemplates] = useState(instance.templates);
  const [generations, setGenerations] = useState(instance.generations);
  const [sources, setSources] = useState(instance.sources);
  const [frozen] = useState(instance.frozen);

  const [dirty, setDirty] = useState(_dirty);

  const [working, setWorking] = useState(false);
  const [workingTitle, setWorkingTitle] = useState("");

  const [templatesPreviews, setTemplatesPreviews] = useState<string[]>(null);
  const [generationPreviews, setGenerationPreviews] = useState<string[]>(null);
  const task = useErrorHandler(setWorking);

  useEffect(() => {
    const onUxpExport = ({
      name,
      items,
    }: {
      name: string;
      items: Partial<SourceItem>[];
    }) => {
      setSources((sources) => [...sources, makeSource(name, items)]);
      setDirty(true);
    };

    uxpContext.on("uxp-export", onUxpExport);

    return () => uxpContext.off("uxp-export", onUxpExport);
  }, []);

  useEffect(() => {
    task("factory initialization & preview", async () => {
      setWorkingTitle("factory initialization & preview...");

      if (!(await hasFactory(id)))
        await createFactory(id, configuration, projectDir);
      else {
        await factoryReloadConfiguration(id, configuration);
        await factoryReloadLayers(id);
      }

      setTemplatesPreviews(
        await Promise.all(
          templates.map((template) => getTemplatePreview(id, template))
        )
      );
      setGenerationPreviews(
        await Promise.all(
          generations.map((generation) => getGenerationPreview(id, generation))
        )
      );
    })();
  }, [templates, generations]);

  const generationItems = useMemo(
    () =>
      generations.map(({ name }) => ({
        name,
      })),
    [generations]
  );

  const generationEmptyValue = useMemo(
    () => (generations.length > 0 ? generations[0].name : null),
    [generations]
  );

  const onSave = task("save", async () => {
    await save(projectDir, {
      ...instance,
      configuration,
      templates,
      generations,
      sources,
    });

    setDirty(false);
  });

  const onConfiguration = task("configuration ", async () => {
    setWorkingTitle("Configuration...");
    navigate("/configuration", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
          sources,
        },
        dirty,
      },
    });
  });

  const onTemplate = task("template", (templateId?: string) => {
    setWorkingTitle("Template...");
    navigate("/template", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
          sources,
        },
        templateId,
        dirty,
      },
    });
  });

  const onGeneration = task("generation", (templateId: string) => {
    setWorkingTitle("Generation...");
    navigate("/generation", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
          sources,
        },
        templateId,
        dirty,
      },
    });
  });

  const onQuality = task("quality", (generationId: string) => {
    setWorkingTitle("Quality...");
    navigate("/quality", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
          sources,
        },
        generationId,
        dirty,
      },
    });
  });

  const onDeploy = task("deploy", () => {
    setWorkingTitle("Deploy...");
    navigate("/deploy", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
          sources,
        },
        dirty,
      },
    });
  });

  const onInstance = task("instance", () => {
    setWorkingTitle("Instance...");
    navigate("/instance", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
          sources,
        },
        dirty,
      },
    });
  });

  const onTemplateAction = (message: string) => {
    const [action, name] = message.split("_");
    switch (action) {
      case "edit":
        return onTemplate(templates.find((t) => t.name === name).id);
      case "generate":
        return onGeneration(templates.find((t) => t.name === name).id);
      case "remove":
        return onRemoveTemplateCommand(name);
    }
  };

  const onQualityAction = (message: string) => {
    const [action, name] = message.split("_");
    switch (action) {
      case "edit":
        return onQuality(generations.find((g) => g.name === name).id);
      case "remove":
        return onRemoveGenerationCommand(name);
    }
  };

  const GenerationItem: React.FC<GenerationItemProps> = ({
    value,
    onChange,
  }) => {
    return (
      <MenuTrigger>
        <ActionButton width="100%">{value}</ActionButton>
        <Menu
          items={generationItems}
          selectionMode="single"
          disallowEmptySelection={true}
          selectedKeys={[value]}
          onSelectionChange={(selectedKeys) => {
            const selectedKey = [...selectedKeys].shift() as string;
            onChange(selectedKey);
          }}
        >
          {({ name }) => <Item key={name}>{name}</Item>}
        </Menu>
      </MenuTrigger>
    );
  };

  const resolveUnifyGenerationFields = (
    field: CustomField,
    value: any,
    onChange: (value: any) => void,
    isDisabled: boolean
  ) => {
    switch (field._type) {
      case "generations":
        return (
          <ArrayOf
            key={field.key}
            isDisabled={isDisabled}
            width="100%"
            Component={GenerationItem}
            label="Generations"
            heading={true}
            emptyValue={generationEmptyValue}
            items={value || []}
            setItems={onChange}
          />
        );
      case "generation":
        return (
          <GenerationItem key={field.key} value={value} onChange={onChange} />
        );
      default:
        break;
    }
  };

  const onUnifyGenerationsCommand = task(
    "unify",

    async ({ newName, generationsNames }) => {
      setWorkingTitle("Unifying generations...");
      const { collection, bundles, drops } = await unifyGenerations(
        id,
        newName,
        generationsNames.map((name) =>
          generations.find((g) => g.name === name)
        ),
        () => {}
      );

      setGenerations((prevGenerations) => [
        ...prevGenerations,
        {
          id: uuid(),
          name: newName,
          collection,
          bundles,
          drops,
        },
      ]);
      setDirty(true);
    }
  );

  const onRemoveTemplateCommand = async (name: string) => {
    setTemplates((prevTemplates) =>
      prevTemplates.filter((t) => t.name !== name)
    );
    setDirty(true);
  };

  const onRemoveGenerationCommand = task("remove", async (name: string) => {
    setWorkingTitle("Removing generation...");
    await removeGeneration(
      id,
      generations.find((g) => g.name === name)
    );
    setGenerations((prevGenerations) =>
      prevGenerations.filter((g) => g.name !== name)
    );
    setDirty(true);
  });

  const onReconstructCommand = task(
    "reconstruct",
    async ({ generationName }) => {
      setWorkingTitle("Reconstructing generation...");
      const _generation = await reconstructGeneration(
        id,
        generations.find((g) => g.name === generationName)
      );

      setGenerations((prevGenerations) =>
        prevGenerations.map((g) =>
          g.name === generationName ? _generation : g
        )
      );

      setDirty(true);
    }
  );

  const onHydrateMetadata = task(
    "hydrate metadata",
    async ({ generationName, imagesCid }) => {
      setWorkingTitle("Hydrating metadata...");
      await hydrateMetadata(
        id,
        generations.find((g) => g.name === generationName),
        imagesCid
      );
    }
  );

  const _XXX = task("XXX", async ({ privateKey }) => {
    console.log(await XXX(privateKey, PolygonNetwork.MUMBAI));
  });

  return (
    <Grid
      areas={["left right"]}
      columns={["2fr", "1fr"]}
      rows={["auto"]}
      height="100%"
      gap="size-100"
      margin="size-100"
    >
      {working && <Loading title={workingTitle} />}

      <View gridArea="left" overflow="auto">
        <Flex direction="column" gap="size-100">
          <Flex gap="size-100" alignItems="center">
            <Heading level={2}>Templates</Heading>

            <ActionButton isDisabled={frozen} onPress={() => onTemplate()}>
              <Add />
            </ActionButton>
          </Flex>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {templatesPreviews &&
                templates.map((template, i) => (
                  <Preview
                    key={i}
                    name={template.name}
                    url={templatesPreviews[i]}
                  >
                    <ActionGroup
                      disabledKeys={
                        frozen
                          ? [
                              `edit_${template.name}`,
                              `generate_${template.name}`,
                              `remove_${template.name}`,
                            ]
                          : []
                      }
                      onAction={onTemplateAction}
                      isJustified
                    >
                      <Item key={`edit_${template.name}`}>
                        <Edit />
                      </Item>
                      <Item key={`generate_${template.name}`}>
                        <Hammer />
                      </Item>
                      <Item key={`remove_${template.name}`}>
                        <Close />
                      </Item>
                    </ActionGroup>
                  </Preview>
                ))}
            </Flex>
          </View>

          <Heading level={2}>Generations</Heading>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {generationPreviews &&
                generations.map((generation, i) => (
                  <Preview
                    key={i}
                    name={generation.name}
                    url={generationPreviews[i]}
                  >
                    <ActionGroup
                      disabledKeys={
                        frozen
                          ? [
                              `edit_${generation.name}`,
                              `remove_${generation.name}`,
                            ]
                          : []
                      }
                      onAction={onQualityAction}
                      isJustified
                    >
                      <Item key={`edit_${generation.name}`}>
                        <Edit />
                      </Item>
                      <Item key={`remove_${generation.name}`}>
                        <Close />
                      </Item>
                    </ActionGroup>
                  </Preview>
                ))}
            </Flex>
          </View>
        </Flex>
      </View>

      <View gridArea="right">
        <Flex gap="size-100" alignItems="center">
          <Heading level={1}>
            {dirty && "*"} {frozen && "[frozen]"} {configuration.name}
          </Heading>
          {/* <ActionButton onPress={onConfiguration}>
            <Settings />
          </ActionButton> */}
          <ActionButton onPress={onSave}>
            <SaveFloppy />
          </ActionButton>
        </Flex>

        <Grid columns={repeat("auto-fit", "300px")} gap="size-100">
          {/* <TaskItem name="Save" onRun={onSave} /> */}

          <TaskItem
            name="XXX"
            fields={[
              {
                key: "privateKey",
                type: "password",
                label: "Private key",
                initial: "",
                value: "",
              },
            ]}
            onRun={_XXX}
          />

          <TaskItem name="Configuration" onRun={onConfiguration} />

          <TaskItem
            isDisabled={frozen}
            name="Unify generations"
            useDialog={true}
            fields={[
              {
                key: "newName",
                type: "string",
                label: "Name",
                initial: "",
                value: "",
              },
              {
                key: "generationsNames",
                type: "custom",
                _type: "generations",
                label: "Generations",
                value: [],
              },
            ]}
            resolveCustomFields={resolveUnifyGenerationFields}
            onRun={onUnifyGenerationsCommand}
          />

          <TaskItem
            isDisabled={frozen}
            name="Reconstruct generation"
            useDialog={true}
            fields={[
              {
                key: "generationName",
                type: "custom",
                _type: "generation",
                label: "Generation",
                value: generationEmptyValue,
              },
            ]}
            resolveCustomFields={resolveUnifyGenerationFields}
            onRun={onReconstructCommand}
          />

          <TaskItem
            isDisabled={frozen}
            name="Hydrate metadata"
            useDialog={true}
            fields={[
              {
                key: "generationName",
                type: "custom",
                _type: "generation",
                label: "Generation",
                value: generationEmptyValue,
              },
              {
                key: "imagesCid",
                type: "string",
                label: "Images CID",
                initial: "",
                value: "",
              },
            ]}
            resolveCustomFields={resolveUnifyGenerationFields}
            onRun={onHydrateMetadata}
          />

          <TaskItem isDisabled={frozen} name="Deploy" onRun={onDeploy} />

          <TaskItem name="Instance" onRun={onInstance} />
        </Grid>
      </View>
    </Grid>
  );
};
