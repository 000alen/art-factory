import React, { useState } from "react";
import { Button, Flex, TextField } from "@adobe/react-spectrum";
import { showOpenDialog } from "../ipcRenderer";

export function OpenTab() {
  const [instanceDir, setInstanceDir] = useState("");

  const onClickInstanceDir = async () => {
    const { canceled, filePaths } = await showOpenDialog({
      properties: ["openDirectory"],
    });

    if (canceled) return;

    setInstanceDir(filePaths[0]);
  };

  const onClickOpen = async () => {};

  return (
    <>
      <Flex direction="row" alignItems="end" gap="size-100">
        <TextField label="Instance Directory" value={instanceDir} isReadOnly />

        <Button onPress={onClickInstanceDir}>Pick</Button>
      </Flex>
      <br />

      <Button
        variant="cta"
        marginTop={8}
        onPress={onClickOpen}
        isDisabled={!instanceDir}
      >
        Open!
      </Button>
    </>
  );
}
