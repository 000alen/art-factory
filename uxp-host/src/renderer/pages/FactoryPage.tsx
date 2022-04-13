import {
  Button,
  Flex,
  Heading,
  View,
  ActionGroup,
  Item,
  ActionButton,
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

    // task("previews", async () => {})();

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
    <View height="100%" margin="size-100" overflow="auto">
      <Flex gap="size-100" alignItems="center">
        <Heading level={1}>{configuration.name}</Heading>

        <ActionButton onPress={onConfiguration}>
          <Settings />
        </ActionButton>
      </Flex>

      <Flex direction="column" gap="size-100">
        <>
          <Flex gap="size-100" alignItems="center">
            <Heading level={2}>Templates</Heading>

            <ActionButton onPress={() => onTemplate()}>
              <Add />
            </ActionButton>
          </Flex>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {instance.templates.map((template, i) => (
                <View
                  borderWidth="thin"
                  borderColor="dark"
                  borderRadius="medium"
                  padding="size-100"
                  height="size-1500"
                  justifySelf="end"
                >
                  {templatesPreviews && templatesPreviews[i] && (
                    <ImageItem src={templatesPreviews[i]} maxSize={128} />
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
                </View>
              ))}
            </Flex>
          </View>
        </>

        <>
          <Heading level={2}>Generations</Heading>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {instance.templates.map((template, i) => (
                <View
                  borderWidth="thin"
                  borderColor="dark"
                  borderRadius="medium"
                  padding="size-100"
                  height="size-1500"
                  justifySelf="end"
                >
                  {generationPreviews && generationPreviews[i] && (
                    <ImageItem src={generationPreviews[i]} maxSize={128} />
                  )}
                  <Heading>{template.name}</Heading>
                  <ActionGroup onAction={onGenerationAction} isJustified>
                    <Item key={`generate_${template.id}`}>
                      <Hammer />
                    </Item>
                  </ActionGroup>
                </View>
              ))}
            </Flex>
          </View>
        </>

        <>
          <Heading level={2}>Quality control</Heading>

          <View marginX="size-200" paddingBottom="size-100" overflow="auto">
            <Flex gap="size-200">
              {instance.generations.map((generation, i) => (
                <View
                  borderWidth="thin"
                  borderColor="dark"
                  borderRadius="medium"
                  padding="size-100"
                  height="size-1500"
                  justifySelf="end"
                >
                  {generationPreviews && generationPreviews[i] && (
                    <ImageItem src={generationPreviews[i]} maxSize={128} />
                  )}
                  <Heading>{generation.name}</Heading>
                  <ActionGroup onAction={onQualityAction} isJustified>
                    <Item key={`edit_${generation.id}`}>
                      <Edit />
                    </Item>
                    {/* <Item>
                      <Close />
                    </Item> */}
                  </ActionGroup>
                </View>
              ))}
            </Flex>
          </View>
        </>

        <Flex marginStart="auto" marginTop="auto">
          <Button variant="cta" margin="size-100" onPress={onDeploy}>
            Deploy
          </Button>
          <Button variant="cta" margin="size-100" onPress={onInstance}>
            Instance
          </Button>
        </Flex>
      </Flex>
    </View>
  );
};
