import {
  Button,
  Divider,
  Flex,
  Grid,
  Heading,
  repeat,
  View,
} from "@adobe/react-spectrum";
import React from "react";

export const FactoryPage: React.FC = () => {
  return (
    <Flex
      height="100%"
      direction="column"
      gap="size-100"
      justifyContent="center"
      alignItems="center"
    >
      <Heading level={1}>Configuration</Heading>
      <Divider />
      <View>
        <Heading level={1}>Nodes</Heading>

        <Flex gap="size-100">
          <Button variant="secondary">Edit Alien</Button>
          <Button variant="secondary">Edit Robot</Button>
          <Button variant="secondary">Edit Reptiles</Button>
        </Flex>
      </View>
      <Divider />
      <View>
        <Heading level={1}>Quality</Heading>

        <Flex gap="size-100">
          <Button variant="secondary">Quality Alien</Button>
          <Button variant="secondary">Quality Robot</Button>
          <Button variant="secondary">Quality Reptiles</Button>
        </Flex>
      </View>{" "}
      <Divider />
      <Button variant="secondary">Deploy</Button>
      <Divider />
      <Button variant="secondary">Instance</Button>
    </Flex>
  );
};
