import React, { useContext, useEffect } from "react";
import {
  Flex,
  Heading,
  Text,
  Button,
  ButtonGroup,
} from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import {
  showOpenDialog,
  factoryInstance,
  factoryLoadInstance,
  getOutputDir,
} from "../ipc";
import { SocketContext } from "../components/SocketContext";
import { v4 as uuid } from "uuid";
import { GenericDialogContext } from "../components/GenericDialog";

export function HomePage() {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const genericDialogContext = useContext(GenericDialogContext);

  useEffect(() => {
    socket.on("uxp-generate", async ({ inputDir, configuration }) => {
      let outputDir;

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
    let inputDir;
    let outputDir;

    // ! TODO: Proper error handling
    try {
      const { canceled, filePaths } = await showOpenDialog({
        properties: ["openFile", "openDirectory"],
      });

      if (canceled) return;

      inputDir = filePaths[0];
      outputDir = await getOutputDir(inputDir);
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    navigate("/generation", {
      state: {
        inputDir,
        outputDir,
        photoshop: false,
      },
    });
  };

  const onOpenInstance = async () => {
    const id = uuid();

    let instancePath;
    let inputDir;
    let outputDir;
    let configuration;
    let attributes;
    let generated;
    let metadataGenerated;
    let imagesCID;
    let metadataCID;
    let network;
    let contractAddress;
    let abi;

    // ! TODO: Proper error handling
    try {
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

      instancePath = filePaths[0];

      await factoryLoadInstance(id, instancePath);
      ({
        inputDir,
        outputDir,
        configuration,
        attributes,
        generated,
        metadataGenerated,
        imagesCID,
        metadataCID,
        network,
        contractAddress,
        abi,
      } = await factoryInstance(id));
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    if (!attributes && !generated) {
      navigate("/generation", {
        state: { inputDir, outputDir, partialConfiguration: configuration },
      });
    } else if (
      !metadataGenerated &&
      !imagesCID &&
      !metadataCID &&
      !contractAddress
    ) {
      navigate("/quality", {
        state: {
          id,
          attributes,
          inputDir,
          outputDir,
          photoshop: false,
          configuration,
        },
      });
    } else if (imagesCID && metadataCID && !contractAddress) {
      navigate("/deploy", {
        state: {
          id,
          attributes,
          inputDir,
          outputDir,
          photoshop: false,
          configuration,
          partialDeploy: {
            imagesCID,
            metadataCID,
          },
        },
      });
    } else if (contractAddress) {
      navigate("/instance", {
        state: {
          id,
          attributes,
          inputDir,
          outputDir,
          photoshop: false,
          configuration,
          imagesCID,
          metadataCID,
          network,
          contractAddress,
          abi,
        },
      });
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
