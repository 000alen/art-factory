import React, { useState } from "react";
import { TextField, Button, Flex } from "@adobe/react-spectrum";
import { showOpenDialog } from "../ipcRenderer";
import { useNavigate } from "react-router-dom";

export function NewTab() {
  const navigator = useNavigate();
  const [inputDir, setInputDir] = useState("");
  const [outputDir, setOutputDir] = useState("");

  const onClickInputDir = async () => {
    const { canceled, filePaths } = await showOpenDialog({
      properties: ["openDirectory"],
    });

    if (canceled) return;

    setInputDir(filePaths[0]);
  };

  const onClickOutputDir = async () => {
    const { canceled, filePaths } = await showOpenDialog({
      properties: ["openDirectory"],
    });

    if (canceled) return;

    setOutputDir(filePaths[0]);
  };

  const onClickGenerate = async () => {
    navigator("/configuration", {
      state: {
        inputDir,
        outputDir,
      },
    });
  };

  return (
    <>
      <Flex direction="row" alignItems="end" gap="size-100">
        <TextField label="Input Directory" value={inputDir} isReadOnly />

        <Button onPress={onClickInputDir}>Pick</Button>
      </Flex>

      <br />

      <Flex direction="row" alignItems="end" gap="size-100">
        <TextField label="Output Directory" value={outputDir} isReadOnly />

        <Button onPress={onClickOutputDir}>Pick</Button>
      </Flex>

      <br />

      <Button
        variant="cta"
        marginTop={8}
        onPress={onClickGenerate}
        isDisabled={!inputDir || !outputDir}
      >
        Generate!
      </Button>
    </>
  );
}
