import React from "react";
import {
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Item,
  Button,
} from "@adobe/react-spectrum";

export function HomePage() {
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

  const onClickTest = () => {
    window.ipcRenderer.once("factoryTestResult", (result) => {
      console.log(result);
    });

    window.ipcRenderer.send(
      "factoryTest",
      "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\input",
      "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\output"
    );
  };

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
    <Flex
      direction="column"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Heading level={2} marginBottom={-2}>
        Welcome to the NFT Factory App
      </Heading>
      <Text marginBottom={8}>
        <i>To start, load the UXP plugin into Photoshop or open a directory</i>
      </Text>

      <Flex width="size-6000" height="size-8000">
        <Tabs aria-label="UXP Helper Options">
          <TabList>
            <Item key="new">Create a new Collection</Item>
            <Item key="open">Open a Collection</Item>
          </TabList>

          <TabPanels>
            <Item key="new">
              <Heading level={3} marginBottom={-2}>
                From Photoshop
              </Heading>
              <Text>
                Load the UXP plugin into Photoshop and start creating NFTs
              </Text>

              <Heading level={3} marginBottom={-2}>
                Or, open a directory
              </Heading>

              <Text>
                Open a directory and start creating NFTs <br />
              </Text>

              <Button marginTop={8} onPress={onClickNew}>
                Open directory
              </Button>

              <Button marginTop={8} onPress={onClickTest}>
                Test Factory
              </Button>
            </Item>
            <Item key="open">
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
            </Item>
          </TabPanels>
        </Tabs>
      </Flex>
    </Flex>
  );
}
