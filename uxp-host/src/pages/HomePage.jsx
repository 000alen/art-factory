import React, { useContext, useEffect } from "react";
import { Flex, Heading, Text, Button } from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import {
  factoryInstance,
  factoryLoadInstance,
  getOutputDir,
} from "../ipcRenderer";
import { SocketContext } from "../components/SocketContext";
import { showOpenDialog } from "../ipcRenderer";
import { v4 as uuid } from "uuid";

export function HomePage() {
  const navigator = useNavigate();
  const socket = useContext(SocketContext);

  useEffect(() => {
    socket.on("uxp-generate", async ({ n, inputDir, configuration }) => {
      const outputDir = await getOutputDir(inputDir);

      navigator("/generation", {
        state: {
          n: Number(n),
          inputDir,
          outputDir,
          configuration,
        },
      });
    });
  }, []);

  const onOpenDirectory = async () => {
    const { canceled, filePaths } = await showOpenDialog({
      properties: ["openFile", "openDirectory"],
    });

    if (canceled) return;

    const [inputDir] = filePaths;
    const outputDir = await getOutputDir(inputDir);

    navigator("/configuration", {
      state: {
        inputDir,
        outputDir,
      },
    });
  };

  const onOpenInstance = async () => {
    const { canceled, filePaths } = await showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Instance",
          extensions: ["json"],
        },
      ],
    });

    if (canceled) return;

    const [instancePath] = filePaths;

    const id = uuid();
    await factoryLoadInstance(id, instancePath);
    const {
      inputDir,
      outputDir,
      configuration,
      n,
      attributes,
      generated,
      metadataGenerated,
      imagesCID,
      metadataCID,
      contractAddress,
    } = await factoryInstance(id);

    if (!attributes || !generated) {
      navigator("/generation", {
        state: { id, n, inputDir, outputDir, configuration },
      });
    } else if (
      !metadataGenerated ||
      !imagesCID ||
      !metadataCID ||
      !contractAddress
    ) {
      navigator("/quality", {
        state: {
          id,
          attributes,
          inputDir,
          outputDir,
          configuration,
        },
      });
    } else if (contractAddress) {
      navigator("/instance", {
        state: {
          id,
          attributes,
          inputDir,
          outputDir,
          configuration,
          contractAddress,
        },
      });
    }
  };

  return (
    <Flex
      direction="column"
      height="100%"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Heading level={2} marginBottom={-2}>
        Welcome to the NFT Factory App
      </Heading>

      <Text marginBottom={8}>
        To start, load the UXP plugin into Photoshop or open a directory
      </Text>

      <Flex gap="size-100">
        <Button variant="cta" onPress={onOpenDirectory}>
          Open Directory!
        </Button>

        <Button onPress={onOpenInstance}>Open Instance!</Button>
      </Flex>
    </Flex>
  );
}
