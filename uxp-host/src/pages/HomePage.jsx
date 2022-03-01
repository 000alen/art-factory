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

export function HomePage() {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const genericDialogContext = useContext(GenericDialogContext);

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

  const onOpenDirectory = async () => {
    let inputDir, outputDir, photoshop;

    try {
      ({ inputDir, outputDir, photoshop } = await openDirectory());
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    navigate("/generation", {
      state: {
        inputDir,
        outputDir,
        photoshop,
      },
    });
  };

  const onOpenInstance = async () => {
    let id, instance;

    try {
      ({ id, instance } = await openInstance());
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    const resolution = resolvePathFromInstance(id, instance);
    if (resolution) {
      const [path, state] = resolution;
      navigate(path, { state });
    } else {
      genericDialogContext.show("Error", "! TODO", null);
      return;
    }
  };

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
