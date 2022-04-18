import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Heading, Text, View, Flex, Divider, Button } from "@adobe/react-spectrum";

import Bug from "@spectrum-icons/workflow/Bug";
import Home from "@spectrum-icons/workflow/Home";



interface ErrorBoundaryProps {}

interface ErrorBoundaryState {
  error: Error;
  hasError: boolean;
}

const GoHomeButton: React.FC<{
  onPress: () => void;
}> = ({onPress}) => {
  const navigate = useNavigate();
  
  const _onPress = () => {
    onPress();
    navigate("/")
  }

  return <>
    <Button variant="cta" marginY="size-100" onPress={_onPress}>
      <Flex alignItems="center">
        <Home margin="size-100" />
        <Text> Go home!</Text>
      </Flex>
    </Button>
  </>
}

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
        <Flex UNSAFE_className="h-screen">
          <View margin="auto">

            <Flex alignItems="center">
              <Bug margin="size-100"/>
              <Heading level={1}> Something went wrong...</Heading>
            </Flex>

            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-250"
              width="size-6000"
            >
              <Heading level={3} >Error log</Heading>
              <Divider marginY="size-100"/>
              <Text>{this.state.error.message}</Text>
            </View>

            <Flex justifyContent="right">
              <GoHomeButton onPress={()=> {
                this.setState({hasError: false});
              }}/>
            </Flex>
          </View>
        </Flex>
      );
    }

    return this.props.children;
  }
}
