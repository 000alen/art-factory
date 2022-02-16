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
import { Link } from "react-router-dom";
import { TestTab } from "../components/TestTab";

export function HomePage() {
  return (
    <Flex
      direction="column"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Link to="/">Home</Link>
      <Link to="/generation">Generation</Link>
      <Link to="/quality">Quality</Link>
      <Link to="/deploy">Deploy</Link>

      <Heading level={2} marginBottom={-2}>
        Welcome to the NFT Factory App
      </Heading>

      <Text marginBottom={8}>
        To start, load the UXP plugin into Photoshop or open a directory
      </Text>

      <Flex width="size-6000" height="size-8000">
        <Tabs aria-label="UXP Helper Options">
          <TabList>
            <Item key="new">Create a new Collection</Item>
            <Item key="open">Open a Collection</Item>
            <Item key="test">Test</Item>
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
