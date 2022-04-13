import { Button, Flex, Heading } from "@adobe/react-spectrum";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToolbarContext } from "../components/Toolbar";
import { CollectionItem, Instance } from "../typings";
import {
  createFactory,
  factoryGetImage,
  hasFactory,
  openInExplorer,
  writeProjectInstance,
} from "../ipc";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import SaveFloppy from "@spectrum-icons/workflow/SaveFloppy";
import Folder from "@spectrum-icons/workflow/Folder";
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
      if (await hasFactory(id)) return;

      await createFactory(id, configuration, projectDir);
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

  return (
    <Flex direction="column" gap="size-100">
      <Button variant="secondary" onPress={onConfiguration}>
        Configuration
      </Button>

      <Button variant="secondary" onPress={() => onTemplate()}>
        Template
      </Button>

      <Flex gap="size-100" marginX="size-500">
        {instance.templates.map((template) => (
          <Button
            key={template.id}
            variant="secondary"
            onPress={() => onTemplate(template.id)}
          >
            {template.name}
          </Button>
        ))}
      </Flex>

      <Heading>Generation</Heading>

      <Flex gap="size-100" marginX="size-500">
        {instance.templates.map((template) => (
          <Button
            key={template.id}
            variant="secondary"
            onPress={() => onGeneration(template.id)}
          >
            {template.name}
          </Button>
        ))}
      </Flex>

      <Heading>Quality</Heading>

      <Flex gap="size-100" marginX="size-500">
        {instance.generations.map((generation) => (
          <Button
            key={generation.id}
            variant="secondary"
            onPress={() => onQuality(generation.id)}
          >
            {generation.name}
          </Button>
        ))}
      </Flex>

      <Button variant="secondary" onPress={onDeploy}>
        Deploy
      </Button>
      <Button variant="secondary" onPress={onInstance}>
        Instance
      </Button>
    </Flex>
  );
};
