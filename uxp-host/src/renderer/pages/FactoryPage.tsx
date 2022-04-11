import { Button, Flex } from "@adobe/react-spectrum";
import React, { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToolbarContext } from "../components/Toolbar";
import { Instance } from "../newTypings";
import { createFactory, hasFactory, writeProjectInstance } from "../ipc";
import Close from "@spectrum-icons/workflow/Close";
import { useErrorHandler } from "../components/ErrorHandler";

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

    task("factory", async () => {
      if (await hasFactory(id)) return;

      await createFactory(id, configuration, projectDir);
    })();

    return () => {
      toolbarContext.removeButton("close");
    };
  }, []);

  const onSave = () => {
    writeProjectInstance(projectDir, instance);
  };

  const onDebug = () => {
    console.log({ projectDir, instance, id });
  };

  const onConfiguration = () => {
    navigate("/configuration", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  };

  const onNodes = (nodesId?: string) => {
    navigate("/nodes", {
      state: {
        projectDir,
        instance,
        id,
        nodesId,
      },
    });
  };

  const onGeneration = (generationId?: string) => {
    navigate("/generation", {
      state: {
        projectDir,
        instance,
        id,
        generationId,
      },
    });
  };

  const onQuality = () => {};

  const onDeploy = () => {};

  const onInstance = () => {};

  return (
    <Flex direction="column" gap="size-100">
      <Button variant="secondary" onPress={onSave}>
        Save
      </Button>
      <Button variant="secondary" onPress={onDebug}>
        Debug
      </Button>
      <Button variant="secondary" onPress={onConfiguration}>
        Configuration
      </Button>

      <Button variant="secondary" onPress={() => onNodes()}>
        Nodes
      </Button>

      <Flex gap="size-100" marginX="size-500">
        {instance.nodes.map((nodes) => (
          <Button
            key={nodes.id}
            variant="secondary"
            onPress={() => onNodes(nodes.id)}
          >
            {nodes.name}
          </Button>
        ))}
      </Flex>

      <Button variant="secondary" onPress={() => onGeneration()}>
        Generation
      </Button>

      <Flex gap="size-100" marginX="size-500">
        {instance.generations.map((generation) => (
          <Button key={generation.id} variant="secondary">
            {generation.name}
          </Button>
        ))}
      </Flex>

      <Button variant="secondary" onPress={onQuality}>
        Quality
      </Button>

      <Flex gap="size-100" marginX="size-500">
        {instance.generations.map((generation) => (
          <Button key={generation.id} variant="secondary">
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
