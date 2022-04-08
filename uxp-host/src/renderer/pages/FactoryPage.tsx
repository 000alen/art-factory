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
    <Grid
      height="100%"
      columns={repeat(2, "size-5000")}
      gap="size-100"
      alignItems="center"
      alignContent="center"
      justifyContent="center"
    >
      <View borderWidth="thin" padding="size-100">
        <Heading level={1}>Configuration</Heading>
        <Button variant="secondary">Go</Button>
      </View>

      <View borderWidth="thin" padding="size-100">
        <Heading level={1}>Nodes</Heading>
        <Button variant="secondary">Go</Button>
      </View>

      <View borderWidth="thin" padding="size-100">
        <Heading level={1}>Quality</Heading>
        <Button variant="secondary">Go</Button>
      </View>

      <View borderWidth="thin" padding="size-100">
        <Heading level={1}>Deploy</Heading>
        <Button variant="secondary">Go</Button>
      </View>

      <View borderWidth="thin" padding="size-100">
        <Heading level={1}>Instance</Heading>
        <Button variant="secondary">Go</Button>
      </View>
    </Grid>
  );
};
