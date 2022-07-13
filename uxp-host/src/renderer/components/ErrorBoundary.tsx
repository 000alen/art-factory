import React from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Divider,
  Flex,
  Heading,
  Text,
  View,
} from "@adobe/react-spectrum";
import Bug from "@spectrum-icons/workflow/Bug";
import Home from "@spectrum-icons/workflow/Home";

interface ErrorBoundaryProps {}

interface ErrorBoundaryState {
  error: Error;
  hasError: boolean;
}

const GoHomeButton: React.FC<{
  onPress: () => void;
}> = ({ onPress, ...rest }) => {
  const navigate = useNavigate();

  const _onPress = () => {
    onPress();
    navigate("/");
  };

  return (
    <>
      <Button variant="cta" alignSelf="end" onPress={_onPress} {...rest}>
        <Home />
        <Text>Go home!</Text>
      </Button>
    </>
  );
};

// ! TODO
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Flex
          direction="column"
          height="100%"
          gap="size-100"
          justifyContent="center"
          alignContent="center"
        >
          <Flex gap="size-100" justifyContent="center" alignItems="center">
            <Bug />
            <Heading level={1}> Something went wrong...</Heading>
          </Flex>

          <Flex
            width="size-6000"
            gap="size-100"
            direction="column"
            justifyContent="center"
            alignItems="center"
            alignSelf="center"
          >
            <View
              UNSAFE_className="space-y-2"
              width="size-6000"
              padding="size-250"
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              justifySelf="center"
            >
              <Heading level={3} marginBottom={-2}>
                Error log
              </Heading>
              <Divider marginBottom={2} />
              <Text>{this.state.error.message}</Text>
            </View>

            <GoHomeButton
              onPress={() => {
                this.setState({ hasError: false });
              }}
            />
          </Flex>
        </Flex>
      );
    }

    return this.props.children;
  }
}
