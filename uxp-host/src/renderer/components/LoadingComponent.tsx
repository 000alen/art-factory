import React from "react";

import { Heading, View, ProgressCircle, Flex } from "@adobe/react-spectrum";

interface ILoadingComponent {
  title: string;
  description: string;
}

export const LoadingComponent: React.FC<ILoadingComponent> = ({title, description}) => {
  return (
    <div 
      className="h-screen w-screen fixed z-10 flex" 
      style={{backgroundColor: "rgba(0,0,0,0.50)"}}
    >
      <div className="m-auto">
        <View
              UNSAFE_className="space-y-2"
              width="size-6000"
              padding="size-250"
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              justifySelf="center"
              UNSAFE_style={{backgroundColor: "#1e1e1e"}}
            >
          <Flex justifyContent="left" alignItems="center">
            <ProgressCircle size="L" isIndeterminate />
            <div className="ml-5">
              <Heading level={1} > {title} </Heading>
              <p> {description} </p>
            </div>
          </Flex>
          
        </View>
      </div>
    </div>
  );
};
