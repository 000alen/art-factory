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
import { NewTab } from "../components/NewTab";
import { OpenTab } from "../components/OpenTab";

export function HomePage() {
  const onClickFactoryTest = () => {
    window.ipcRenderer.once("factoryTestResult", ({ imagesCID, jsonCID }) => {
      console.log(imagesCID, jsonCID);
    });

    window.ipcRenderer.send(
      "factoryTest",
      "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\input",
      "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\output"
    );
  };

  const onClickGetContract = () => {
    window.ipcRenderer.once("getContractResult", (output) => {
      console.log(output);
    });

    window.ipcRenderer.send("getContract");
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
        To start, load the UXP plugin into Photoshop or open a directory
      </Text>

      <Button marginTop={8} onPress={onClickFactoryTest}>
        Test Factory
      </Button>

      <Button marginTop={8} onPress={onClickGetContract}>
        Get Contract
      </Button>

      <Flex width="size-6000" height="size-8000">
        <Tabs aria-label="UXP Helper Options">
          <TabList>
            <Item key="new">Create a new Collection</Item>
            <Item key="open">Open a Collection</Item>
          </TabList>

          <TabPanels>
            <Item key="new">
              <NewTab />
            </Item>
            <Item key="open">
              <OpenTab />
            </Item>
          </TabPanels>
        </Tabs>
      </Flex>
    </Flex>
  );
}
