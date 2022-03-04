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
import { GenericDialogContext } from "../components/GenericDialog";
import {
  openDirectory,
  openInstance,
  resolvePathFromInstance,
} from "../actions";
import { useErrorHandler } from "../components/ErrorHandler";
import { UXPContext } from "../components/UXPContext";

export function HomePage() {
  const navigate = useNavigate();
  const uxpContext = useContext(UXPContext);
  const genericDialogContext = useContext(GenericDialogContext);
  const { task } = useErrorHandler(genericDialogContext);

  // ! TODO
  useEffect(() => {
    const uxpGenerate = async ({
      photoshopId,
      inputDir,
      partialConfiguration,
    }) => {
      const outputDir = await getOutputDir(inputDir);

      navigate("/configuration", {
        state: {
          inputDir,
          outputDir,
          partialConfiguration,
          photoshopId,
          photoshop: true,
        },
      });
    };

    uxpContext.on("uxp-generate", uxpGenerate);
    return () => {
      uxpContext.off("uxp-generate", uxpGenerate);
    };
  }, [navigate, genericDialogContext]);

  const onOpenDirectory = task("open directory", async () => {
    const result = await openDirectory();
    if (result) {
      const { inputDir, outputDir, photoshopId, photoshop } = result;
      navigate("/configuration", {
        state: {
          inputDir,
          outputDir,
          photoshopId,
          photoshop,
        },
      });
    }
  });

  const onOpenInstance = task("open instance", async () => {
    const result = await openInstance();

    if (result) {
      const { id, instance } = result;

      const resolution = resolvePathFromInstance(id, instance);
      if (resolution) {
        const [path, state] = resolution;
        navigate(path, { state });
      } else {
        throw new Error("Could not resolve path for given instance");
      }
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
