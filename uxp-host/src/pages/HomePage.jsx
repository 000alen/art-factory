import React, { useContext, useEffect } from "react";
import {
  Flex,
  Heading,
  Text,
  Button,
  ButtonGroup,
} from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import { getOutputDir } from "../ipc";
import { SocketContext } from "../components/SocketContext";
import { GenericDialogContext } from "../components/GenericDialog";
import {
  openDirectory,
  openInstance,
  resolvePathFromInstance,
} from "../actions";
import { useErrorHandler } from "../components/ErrorHandler";

export function HomePage() {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const genericDialogContext = useContext(GenericDialogContext);
  const { task } = useErrorHandler(genericDialogContext);

  useEffect(() => {
    socket.on("uxp-generate", async ({ inputDir, configuration }) => {
      let outputDir;

      // ! TODO: proper error handling
      try {
        outputDir = await getOutputDir();
      } catch (error) {
        genericDialogContext.show("Error", error.message, null);
        return;
      }

      navigate("/generation", {
        state: {
          inputDir,
          outputDir,
          photoshop: true,
          partialConfiguration: configuration,
        },
      });
    });
  }, [navigate, socket, genericDialogContext]);

  const onOpenDirectory = task("open directory", async () => {
    const { inputDir, outputDir, photoshop } = await openDirectory();
    navigate("/generation", {
      state: {
        inputDir,
        outputDir,
        photoshop,
      },
    });
  });

  const onOpenInstance = task("open instance", async () => {
    const { id, instance } = await openInstance();

    const resolution = resolvePathFromInstance(id, instance);
    if (resolution) {
      const [path, state] = resolution;
      navigate(path, { state });
    } else {
      throw new Error("Could not resolve path for given instance");
    }
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
      <Heading level={1} marginBottom={-2}>
        Welcome to the NFT Factory App
      </Heading>

      <Text marginBottom={8}>
        To start, load the UXP plugin into Photoshop or open a directory
      </Text>

      <ButtonGroup>
        <Button variant="cta" onPress={onOpenDirectory}>
          Open Directory!
        </Button>

        <Button onPress={onOpenInstance}>Open Instance!</Button>
      </ButtonGroup>
    </Flex>
  );
}
