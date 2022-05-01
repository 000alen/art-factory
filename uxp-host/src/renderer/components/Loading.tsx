import React from "react";

import { Flex, Heading, ProgressCircle, View } from "@adobe/react-spectrum";

interface LoadingProps {
  title: string;
}

export const Loading: React.FC<LoadingProps> = ({ title }) => {
  return (
    <View
      UNSAFE_className="bg-black bg-opacity-50"
      zIndex={1003}
      position="absolute"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
    >
      <Flex
        width="100%"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <View
          backgroundColor="gray-100"
          padding="size-100"
          paddingX="size-250"
          borderWidth="thin"
          borderColor="dark"
          borderRadius="medium"
          justifySelf="center"
        >
          <Flex gap="size-100" alignItems="center">
            <ProgressCircle isIndeterminate />
            <Heading level={1}> {title} </Heading>
          </Flex>
        </View>
      </Flex>
    </View>
  );
};
