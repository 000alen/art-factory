import React from "react";
import {
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Item,
} from "@adobe/react-spectrum";
import { NewTab } from "../components/NewTab";
import { OpenTab } from "../components/OpenTab";
import { TestTab } from "../components/TestTab";

export function HomePage() {
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

      <Flex width="size-6000" height="size-8000">
        <Tabs aria-label="UXP Helper Options">
          <TabList>
            <Item key="new">New Collection</Item>
            <Item key="open">Open an existing Collection</Item>
            <Item key="test">Testing</Item>
          </TabList>

          <TabPanels>
            <Item key="new">
              <NewTab />
            </Item>
            <Item key="open">
              <OpenTab />
            </Item>
            <Item key="test">
              <TestTab />
            </Item>
          </TabPanels>
        </Tabs>
      </Flex>
    </Flex>
  );
}
