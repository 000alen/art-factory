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
} from "@adobe/react-spectrum";
import React, { useContext, useEffect } from "react";
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
import { TaskItem } from "../components/TaskItem";

interface FactoryPageState {
  projectDir: string;
  instance: Instance;
  id: string;
}

export const FactoryPage: React.FC = () => {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id } = state as FactoryPageState;
  const { configuration } = instance;

  const [templatesPreviews, setTemplatesPreviews] = useState<string[]>(null);
  const [generationPreviews, setGenerationPreviews] = useState<string[]>(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("save", "Save", <SaveFloppy />, () =>
      writeProjectInstance(projectDir, instance)
    );
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => {
        openInExplorer(projectDir);
      }
    );

    task("factory", async () => {
      if (!(await hasFactory(id)))
        await createFactory(id, configuration, projectDir);

      const templatesBase64Strings = await Promise.all(
        instance.templates.map(async ({ nodes, edges }) => {
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
        instance.generations.map(async ({ name, collection }) => {
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

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("save");
      toolbarContext.removeButton("open-explorer");
    };
  }, []);

  const onConfiguration = () => {
    navigate("/configuration", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  };

  const onTemplate = (templateId?: string) => {
    navigate("/template", {
      state: {
        projectDir,
        instance,
        id,
        templateId,
      },
    });
  };

  const onGeneration = (templateId: string) => {
    navigate("/generation", {
      state: {
        projectDir,
        instance,
        id,
        templateId,
      },
    });
  };

  const onQuality = (generationId: string) => {
    navigate("/quality", {
      state: {
        projectDir,
        instance,
        id,
        generationId,
      },
    });
  };

  const onDeploy = () => {
    navigate("/deploy", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  };

  const onInstance = () => {
    navigate("/instance", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  };

  const onTemplateAction = (message: string) => {
    const [action, id] = message.split("_");
    switch (action) {
      case "edit":
        onTemplate(id);
        break;
    }
  };

  const onGenerationAction = (message: string) => {
    const [action, id] = message.split("_");
    switch (action) {
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

  return (
    <Grid
      UNSAFE_className="overflow-hidden"
      areas={["left right"]}
      columns={["1fr", "2fr"]}
      rows={["auto"]}
      height="100%"
      gap="size-100"
      margin="size-100"
    >
      <View
        UNSAFE_style={{
          direction: "rtl",
        }}
        gridArea="left"
        overflow="auto"
      >
        <Flex
          UNSAFE_style={{
            direction: "ltr",
          }}
          margin="size-100"
          direction="column"
          gap="size-100"
        >
          <Flex gap="size-100" alignItems="center">
            <Heading level={2}>Templates</Heading>

            <ActionButton onPress={() => onTemplate()}>
              <Add />
            </ActionButton>
          </Flex>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {instance.templates.map((template, i) => (
                <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
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
              {instance.templates.map((template, i) => (
                <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
                  <Flex direction="column" gap="size-100">
                    {templatesPreviews && templatesPreviews[i] ? (
                      <ImageItem src={templatesPreviews[i]} maxSize={192} />
                    ) : (
                      <div className="w-48 h-48 flex justify-center items-center">
                        <Text>Nothing to see here</Text>
                      </div>
                    )}
                    <Heading>{template.name}</Heading>
                    <ActionGroup onAction={onGenerationAction} isJustified>
                      <Item key={`generate_${template.id}`}>
                        <Hammer />
                      </Item>
                    </ActionGroup>
                  </Flex>
                </div>
              ))}
            </Flex>
          </View>

          <Heading level={2}>Quality control</Heading>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {instance.generations.map((generation, i) => (
                <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
                  <Flex direction="column" gap="size-100">
                    {templatesPreviews && templatesPreviews[i] ? (
                      <ImageItem src={templatesPreviews[i]} maxSize={192} />
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
              <Heading level={1}>{configuration.name}</Heading>

              <ActionButton onPress={onConfiguration}>
                <Settings />
              </ActionButton>
            </Flex>

            <Grid columns={repeat("auto-fit", "300px")} gap="size-100">
              <TaskItem task="Cost" onRun={() => {}} />
              <TaskItem
                task="Balance of"
                onRun={() => {}}
                fields={[
                  {
                    key: "address",
                    type: "address",
                    label: "Address",
                  },
                ]}
              />

              <TaskItem
                task="Token of owner by index"
                onRun={() => {}}
                fields={[
                  {
                    key: "address",
                    type: "address",
                    label: "Address",
                  },
                  {
                    key: "index",
                    type: "int",
                    label: "Index",
                  },
                ]}
              />

              <TaskItem
                task="Token URI"
                onRun={() => {}}
                fields={[
                  {
                    key: "index",
                    type: "int",
                    label: "Token Index",
                  },
                ]}
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
