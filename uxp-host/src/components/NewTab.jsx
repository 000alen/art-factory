import React from "react";
import { Heading, Text, Button } from "@adobe/react-spectrum";

export function NewTab() {
  const onClickNew = () => {
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
        From Photoshop
      </Heading>
      <Text>Load the UXP plugin into Photoshop and start creating NFTs</Text>

      <Heading level={3} marginBottom={-2}>
        Or, open a directory
      </Heading>

      <Text>
        Open a directory and start creating NFTs <br />
      </Text>

      <Button marginTop={8} onPress={onClickNew}>
        Open directory
      </Button>
    </>
  );
}
