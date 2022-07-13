import React from "react";
import { useNavigate } from "react-router-dom";

import { Button, ButtonGroup, Flex, Heading } from "@adobe/react-spectrum";

import { newProject, openProject, save } from "../commands";
import { useErrorHandler } from "../components/ErrorHandler";

export function HomePage() {
  const task = useErrorHandler();
  const navigate = useNavigate();

  const onNew = task("new", async () => {
    const { projectDir, instance, id } = await newProject();

    await save(projectDir, instance);

    navigate("/factory", {
      state: {
        projectDir,
        id,
        instance,
        dirty: false,
      },
    });
  });

  const onOpen = task("open", async () => {
    const { projectDir, instance, id } = await openProject();

    navigate("/factory", {
      state: {
        projectDir,
        id,
        instance,
        dirty: false,
      },
    });
  });

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Heading level={1}>Welcome to the Art Factory!</Heading>

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
