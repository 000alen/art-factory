import React from "react";
import { Flex, Heading, Button, ButtonGroup } from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import { useErrorHandler } from "../components/ErrorHandler";
import { v4 as uuid } from "uuid";
import {
  ensureProjectStructure,
  readProjectInstance,
  showOpenDialog,
  writeProjectInstance,
} from "../ipc";
import { createInstance } from "../newUtils";

export function HomePage() {
  const navigate = useNavigate();
  const task = useErrorHandler();

  const onNew = task("new", async () => {
    const { canceled, filePaths } = await showOpenDialog({
      properties: ["openFile", "openDirectory"],
    });

    if (canceled) return;

    const [projectDir] = filePaths;
    const instance = createInstance();
    const id = uuid();

    await ensureProjectStructure(projectDir);
    await writeProjectInstance(projectDir, instance);

    navigate("/factory", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  });

  const onOpen = task("open", async () => {
    const { canceled, filePaths } = await showOpenDialog({
      properties: ["openFile", "openDirectory"],
    });

    if (canceled) return;

    const [projectDir] = filePaths;
    const instance = await readProjectInstance(projectDir);
    const id = uuid();

    navigate("/factory", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  });

  return (
    <Flex
      direction="column"
      height="100%"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Heading level={1} marginBottom={-2}>
        Welcome to the Art Factory!
      </Heading>

      <ButtonGroup>
        <Button variant="cta" onPress={onNew}>
          New
        </Button>

        <Button variant="secondary" onPress={onOpen}>
          Open
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
