import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import {
  ActionButton,
  ActionGroup,
  Flex,
  Grid,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  repeat,
  Text,
  View,
} from "@adobe/react-spectrum";
import Add from "@spectrum-icons/workflow/Add";
import Close from "@spectrum-icons/workflow/Close";
import Edit from "@spectrum-icons/workflow/Edit";
import Folder from "@spectrum-icons/workflow/Folder";
import Hammer from "@spectrum-icons/workflow/Hammer";
import Settings from "@spectrum-icons/workflow/Settings";

import {
  getGenerationPreview,
  getTemplatePreview,
  removeGeneration,
  unifyGenerations,
} from "../commands";
import { ArrayOf } from "../components/ArrayOf";
import { useErrorHandler } from "../components/ErrorHandler";
import { ImageItem } from "../components/ImageItem";
import { CustomField, TaskItem } from "../components/TaskItem";
import { ToolbarContext } from "../components/Toolbar";
import {
  createFactory,
  factoryReloadConfiguration,
  factoryReloadLayers,
  hasFactory,
  openInExplorer,
  writeProjectInstance,
} from "../ipc";
import { Instance } from "../typings";
import Copy from "@spectrum-icons/workflow/Copy";
import Zoom from "react-medium-image-zoom";
import { Preview } from "../components/Preview";
import { Loading } from "../components/Loading";

interface FactoryPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  dirty: boolean;
}

interface GenerationItemProps {
  value: string;
  onChange: (value: string) => void;
}

export const FactoryPage: React.FC = () => {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id, dirty: _dirty } = state as FactoryPageState;

  const { configuration } = instance;

  const [working, setWorking] = useState(false);
  const [workingTitle, setWorkingTitle] = useState("");

  const [dirty, setDirty] = useState(_dirty);
  const [templates, setTemplates] = useState(instance.templates);
  const [generations, setGenerations] = useState(instance.generations);

  const [templatesPreviews, setTemplatesPreviews] = useState<string[]>(null);
  const [generationPreviews, setGenerationPreviews] = useState<string[]>(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => openInExplorer(projectDir)
    );

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("open-explorer");
    };
  }, []);

  useEffect(() => {
    task("factory initialization & preview", async () => {
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
    await writeProjectInstance(projectDir, {
      ...instance,
      configuration,
      templates,
      generations,
    });
    setDirty(false);
  });

  const onConfiguration = () => {
    navigate("/configuration", {
      state: {
        projectDir,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
        },
        id,
        dirty,
      },
    });
  };

  const onTemplate = (templateId?: string) => {
    navigate("/template", {
      state: {
        projectDir,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
        },
        id,
        templateId,
        dirty,
      },
    });
  };

  const onGeneration = (templateId: string) => {
    navigate("/generation", {
      state: {
        projectDir,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
        },
        id,
        templateId,
        dirty,
      },
    });
  };

  const onQuality = (generationId: string) => {
    navigate("/quality", {
      state: {
        projectDir,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
        },
        id,
        generationId,
        dirty,
      },
    });
  };

  const onDeploy = () => {
    navigate("/deploy", {
      state: {
        projectDir,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
        },
        id,
        dirty,
      },
    });
  };

  const onInstance = () => {
    navigate("/instance", {
      state: {
        projectDir,
        instance: {
          ...instance,
          configuration,
          templates,
          generations,
        },
        id,
        dirty,
      },
    });
  };

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
    value: string[],
    onChange: (value: string[]) => void
  ) => {
    switch (field._type) {
      case "generations":
        return (
          <ArrayOf
            key={field.key}
            width="100%"
            Component={GenerationItem}
            label="Generations"
            heading={true}
            emptyValue={generationEmptyValue}
            items={value || []}
            setItems={onChange}
          />
        );
      default:
        break;
    }
  };

  const onUnifyGenerationsCommand = task(
    "unify",

    async ({ newName, generationsNames }) => {
      setWorkingTitle("Unifying generations...");
      setWorking(true);
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
      setWorking(false);
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
    setWorking(true);
    await removeGeneration(
      id,
      generations.find((g) => g.name === name)
    );
    setGenerations((prevGenerations) =>
      prevGenerations.filter((g) => g.name !== name)
    );
    setDirty(true);
    setWorking(false);
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

            <ActionButton onPress={() => onTemplate()}>
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
                    <ActionGroup onAction={onTemplateAction} isJustified>
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
                    <ActionGroup onAction={onQualityAction} isJustified>
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
            {dirty && "*"} {configuration.name}
          </Heading>
          <ActionButton onPress={onConfiguration}>
            <Settings />
          </ActionButton>
        </Flex>

        <Grid columns={repeat("auto-fit", "300px")} gap="size-100">
          <TaskItem name="Save" onRun={onSave} />
          <TaskItem
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
          <TaskItem name="Deploy" onRun={onDeploy} />
          <TaskItem name="Instance" onRun={onInstance} />
          <TaskItem name="Import from files" onRun={() => {}} />
          <TaskItem name="Reload generation" onRun={() => {}} />
        </Grid>
      </View>
    </Grid>
  );
};
