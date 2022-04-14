import { Heading, Text } from "@adobe/react-spectrum";
import React from "react";
import { Link } from "react-router-dom";

interface ErrorBoundaryProps {}

interface ErrorBoundaryState {
  error: Error;
  hasError: boolean;
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
        <>
          <Heading>Something went wrong :(</Heading>
          <Text>{this.state.error.message}</Text>
          <Link to="/" onClick={() => this.setState({ hasError: false })}>
            Go home
          </Link>
        </>
      );
    }

    return this.props.children;
  }
}
