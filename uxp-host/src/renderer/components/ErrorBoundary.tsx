import { Heading } from "@adobe/react-spectrum";
import React from "react";
import { Link } from "react-router-dom";

interface ErrorBoundaryProps {}

interface ErrorBoundaryState {
  hasError: boolean;
}


// ! TODO
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <Heading>Something went wrong :(</Heading>
          <Link to="/" onClick={() => this.setState({ hasError: false })}>
            Go home
          </Link>
        </>
      );
    }

    return this.props.children;
  }
}
