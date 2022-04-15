import {
  Button,
  Flex,
  Heading,
  View,
  ActionGroup,
  Item,
  ActionButton,
  Grid,
  Text,
  ButtonGroup,
  repeat,
  MenuTrigger,
  Menu,
} from "@adobe/react-spectrum";
import React, { useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToolbarContext } from "../components/Toolbar";
import { Instance, Trait } from "../typings";
import {
  createFactory,
  factoryComposeTraits,
  factoryGetImage,
  hasFactory,
  openInExplorer,
  writeProjectInstance,
} from "../ipc";
import { useErrorHandler } from "../components/ErrorHandler";
import SaveFloppy from "@spectrum-icons/workflow/SaveFloppy";
import Folder from "@spectrum-icons/workflow/Folder";
import Settings from "@spectrum-icons/workflow/Settings";
import Close from "@spectrum-icons/workflow/Close";
import Edit from "@spectrum-icons/workflow/Edit";
import Hammer from "@spectrum-icons/workflow/Hammer";
import Add from "@spectrum-icons/workflow/Add";
import { useState } from "react";
import { getBranches } from "../nodesUtils";
import { LayerNodeComponentData } from "../components/LayerNode";
import { Node as FlowNode } from "react-flow-renderer";
import { MAX_SIZE } from "../constants";
import { ImageItem } from "../components/ImageItem";
import { CustomField, TaskItem } from "../components/TaskItem";
import { AAA } from "../ipc";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { ArrayOf } from "../components/ArrayOf";
import { unifyGenerations } from "../commands";
import { v4 as uuid } from "uuid";

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

  const [dirty, setDirty] = useState(_dirty);
  const [configuration, setConfiguration] = useState(instance.configuration);
  const [templates, setTemplates] = useState(instance.templates);
  const [generations, setGenerations] = useState(instance.generations);

  const [templatesPreviews, setTemplatesPreviews] = useState<string[]>(null);
  const [generationPreviews, setGenerationPreviews] = useState<string[]>(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("save", "Save", <SaveFloppy />, () => onSave());
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => {
        openInExplorer(projectDir);
      }
    );

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("save");
      toolbarContext.removeButton("open-explorer");
    };
  }, []);

  useEffect(() => {
    task("factory", async () => {
      // ! TODO: Update factory
      if (!(await hasFactory(id)))
        await createFactory(id, configuration, projectDir);

      const templatesBase64Strings = await Promise.all(
        templates.map(async ({ nodes, edges }) => {
          const nData = (
            getBranches(nodes, edges).map((branch) =>
              branch.slice(1, -1)
            ) as FlowNode<LayerNodeComponentData>[][]
          ).map((branch) => branch.map((node) => node.data));
          const nTraits: Trait[][] = nData.map((branch) =>
            branch.map((data) => ({
              ...data.trait,
              id: data.id,
              opacity: data.opacity,
              blending: data.blending,
            }))
          );
          const traits = nTraits.shift();

          return traits
            ? await factoryComposeTraits(id, traits, MAX_SIZE)
            : null;
        })
      );
      const templatesUrls = templatesBase64Strings.map((base64String) =>
        base64String ? `data:image/png;base64,${base64String}` : null
      );

      const generationBase64Strings = await Promise.all(
        generations.map(async ({ name, collection }) => {
          return collection.length > 0
            ? await factoryGetImage(id, name, collection[0])
            : null;
        })
      );
      const generationUrls = generationBase64Strings.map((base64String) =>
        base64String ? `data:image/png;base64,${base64String}` : null
      );

      setTemplatesPreviews(templatesUrls);
      setGenerationPreviews(generationUrls);
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
    () => generations[0].name,
    [generations]
  );

  const onSave = async () => {
    await writeProjectInstance(projectDir, {
      ...instance,
      configuration,
      templates,
      generations,
    });
    setDirty(false);
  };

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
    const [action, id] = message.split("_");
    switch (action) {
      case "edit":
        onTemplate(id);
        break;
      case "generate":
        onGeneration(id);
        break;
    }
  };

  const onQualityAction = (message: string) => {
    const [action, id] = message.split("_");
    switch (action) {
      case "edit":
        onQuality(id);
        break;
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

  const onUnifyGenerationsCommand = async ({ newName, generationsNames }) => {
    const { collection, bundles } = await unifyGenerations(
      id,
      newName,
      generationsNames.map((name) => generations.find((g) => g.name === name)),
      () => {}
    );

    setGenerations((prevGenerations) => [
      ...prevGenerations,
      {
        id: uuid(),
        name: newName,
        collection,
        bundles,
      },
    ]);
    setDirty(true);
  };

  return (
    <Grid
      areas={["left right"]}
      columns={["2fr", "1fr"]}
      rows={["auto"]}
      height="100%"
      gap="size-100"
      margin="size-100"
    >
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
              {templates.map((template, i) => (
                <div
                  key={template.id}
                  className="relative w-48 p-3 border-1 border-solid border-white rounded"
                >
                  <Flex direction="column" gap="size-100">
                    {templatesPreviews && templatesPreviews[i] ? (
                      <ImageItem src={templatesPreviews[i]} maxSize={192} />
                    ) : (
                      <div className="w-48 h-48 flex justify-center items-center">
                        <Text>Nothing to see here</Text>
                      </div>
                    )}
                    <Heading>{template.name}</Heading>
                    <ActionGroup onAction={onTemplateAction} isJustified>
                      <Item key={`edit_${template.id}`}>
                        <Edit />
                      </Item>
                      <Item key={`generate_${template.id}`}>
                        <Hammer />
                      </Item>
                      <Item key="close">
                        <Close />
                      </Item>
                    </ActionGroup>
                  </Flex>
                </div>
              ))}
            </Flex>
          </View>

          <Heading level={2}>Generations</Heading>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {generations.map((generation, i) => (
                <div
                  key={generation.id}
                  className="relative w-48 p-3 border-1 border-solid border-white rounded"
                >
                  <Flex direction="column" gap="size-100">
                    {generationPreviews && generationPreviews[i] ? (
                      <ImageItem src={generationPreviews[i]} maxSize={192} />
                    ) : (
                      <div className="w-48 h-48 flex justify-center items-center">
                        <Text>Nothing to see here</Text>
                      </div>
                    )}
                    <Heading>{generation.name}</Heading>
                    <ActionGroup onAction={onQualityAction} isJustified>
                      <Item key={`edit_${generation.id}`}>
                        <Edit />
                      </Item>
                      <Item>
                        <Close />
                      </Item>
                    </ActionGroup>
                  </Flex>
                </div>
              ))}
            </Flex>
          </View>
        </Flex>
      </View>

      <View gridArea="right">
        <Flex height="100%" direction="column" justifyContent="space-between">
          <Flex direction="column" gap="size-100">
            <Flex gap="size-100" alignItems="center">
              <Heading level={1}>
                {dirty && "*"} {configuration.name}
              </Heading>

              <ActionButton onPress={onConfiguration}>
                <Settings />
              </ActionButton>
            </Flex>

            <Grid columns={repeat("auto-fit", "300px")} gap="size-100">
              <TaskItem
                name="AAA"
                onRun={async () => {
                  const uri = await AAA();

                  WalletConnectQRCodeModal.open(uri, () => {
                    console.log("QR Code Modal closed");
                  });
                }}
              />
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
            </Grid>
          </Flex>

          <ButtonGroup align="end">
            <Button variant="cta" margin="size-100" onPress={onDeploy}>
              Deploy
            </Button>
            <Button variant="cta" margin="size-100" onPress={onInstance}>
              Instance
            </Button>
          </ButtonGroup>
        </Flex>
      </View>
    </Grid>
  );
};
