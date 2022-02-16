import React from "react";
import { Heading, Text, Button } from "@adobe/react-spectrum";

export function OpenTab() {
  const onClickOpen = () => {
    window.ipcRenderer.once(
      "showOpenDialogResult",
      ({ canceled, filePaths }) => {
        if (canceled) return;
        console.log(filePaths);
      }
    );

    window.ipcRenderer.send("showOpenDialog", {
      properties: ["openDirectory"],
    });
  };

  return (
    <>
      <Heading level={3} marginBottom={-2}>
        Open a directory
      </Heading>
      <Text>
        Open a directory and interact with your NFTs
        <br />
      </Text>

      <Button marginTop={8} onPress={onClickOpen}>
        Open directory
      </Button>
    </>
  );
}
