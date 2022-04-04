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
  const task = useErrorHandler();

  useEffect(() => {
    const uxpGenerate = async ({
      inputDir,
      partialConfiguration,
    }: {
      inputDir: string;
      partialConfiguration: any;
    }) => {
      const outputDir = await getOutputDir(inputDir);

      navigate("/configuration", {
        state: {
          inputDir,
          outputDir,
          partialConfiguration,
        },
      });
    };

    uxpContext.on("uxp-generate", uxpGenerate);
    return () => {
      uxpContext.off("uxp-generate", uxpGenerate);
    };
  }, []);

  const onOpenDirectory = task("open directory", async () => {
    const result = await openDirectory();

    if (result) {
      const { inputDir, outputDir } = result;
      navigate("/configuration", {
        state: {
          inputDir,
          outputDir,
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
        const [path, state] = resolution as [string, any];
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
        Welcome to the Art Factory!
      </Heading>

      <Text marginBottom={8}>
        To start, load the plugin into Photoshop or open a directory
      </Text>

      <ButtonGroup>
        <Button variant="cta" onPress={onOpenDirectory}>
          Open Directory!
        </Button>

        <Button variant="secondary" onPress={onOpenInstance}>
          Open Instance!
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
