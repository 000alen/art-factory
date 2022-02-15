import React from 'react';
import { View } from '@adobe/react-spectrum';

const TextContainer = ({ children }) => {
  return (
    <View
      borderWidth="thin"
      borderColor="dark"
      borderRadius="medium"
      backgroundColor="dark"
      padding="size-100"
    >
      {children}
    </View>
  );
};

export default TextContainer;
