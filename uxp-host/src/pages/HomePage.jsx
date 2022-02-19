import React, { useContext, useEffect } from "react";
import { Flex, Heading, Text, Button } from "@adobe/react-spectrum";
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
  const { showDialog, setDialog } = useContext(DialogContext);

  useEffect(() => {
    socket.on("uxp-generate", async ({ n, inputDir, configuration }) => {
      const outputDir = await getOutputDir(inputDir);
      const id = uuid();

      await createFactory(id, configuration, inputDir, outputDir, { n });

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
    setDialog("Test", "This is a test dialog", null);
    showDialog();
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

        <Button onPress={onClickTest}>Test</Button>
      </Flex>
    </Flex>
  );
}
