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
  createFactory,
} from "../ipc";
import { SocketContext } from "../components/SocketContext";
import { v4 as uuid } from "uuid";
import { DialogContext } from "../App";

export function HomePage() {
  const navigator = useNavigate();
  const socket = useContext(SocketContext);
  const dialogContext = useContext(DialogContext);

  useEffect(() => {
    socket.on("uxp-generate", async ({ n, inputDir, configuration }) => {
      const id = uuid();
      let outputDir;

      // ! TODO
      try {
        outputDir = await getOutputDir(inputDir);
        await createFactory(id, configuration, inputDir, outputDir, { n });
      } catch (error) {
        dialogContext.setDialog("Error", error.message, null, true);
        return;
      }

      navigator("/generation", {
        state: {
          id,
          n: Number(n),
          inputDir,
          outputDir,
          configuration,
        },
      });
    });
  }, []);

  const onOpenDirectory = async () => {
    let inputDir;
    let outputDir;

    // ! TODO
    try {
      const { canceled, filePaths } = await showOpenDialog({
        properties: ["openFile", "openDirectory"],
      });

      if (canceled) return;

      inputDir = filePaths[0];
      outputDir = await getOutputDir(inputDir);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    navigator("/configuration", {
      state: {
        inputDir,
        outputDir,
      },
    });
  };

  const onOpenInstance = async () => {
    const id = uuid();

    let instancePath;
    let inputDir;
    let outputDir;
    let configuration;
    let n;
    let attributes;
    let generated;
    let metadataGenerated;
    let imagesCID;
    let metadataCID;
    let contractAddress;

    // ! TODO
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
        n,
        attributes,
        generated,
        metadataGenerated,
        imagesCID,
        metadataCID,
        contractAddress,
      } = await factoryInstance(id));
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

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

  const onClickTest = () => {
    // console.log("sending host-edit");
    // socket.emit("host-edit", {
    //   name: "HOLI",
    //   traits: [
    //     { name: "1. Background", value: "Pink" },
    //     { name: "2. Fur", value: "Green" },
    //     { name: "3. Clothes", value: "Dress Shirt" },
    //     { name: "4. Mouth Accessories", value: "Cigarette" },
    //     { name: "5. Eyes", value: "Heart Glasses" },
    //     { name: "6. Head Accessories", value: "Halo" },
    //   ],
    // });
    dialogContext.setDialog("Test", "Test dialog", null, true);
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

        <Button onPress={onClickTest}>Test</Button>
      </ButtonGroup>
    </Flex>
  );
}
