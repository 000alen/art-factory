import { HomePage } from "./pages/HomePage";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { SocketContext } from "./components/SocketContext";

import { Flex, StatusLight } from "@adobe/react-spectrum";
import React, { useState, useEffect, useContext } from "react";

const App = () => {
  const socket = useContext(SocketContext);
  const [connectionStatus, setConnectionStatus] = useState(false);

  useEffect(() => {
    socket.on("uxp-connected", (isUXPConnected) => {
      setConnectionStatus(isUXPConnected);
    });
  }, []);

  const connectionStatusLight = connectionStatus ? (
    <StatusLight variant="positive">Connected to UXP</StatusLight>
  ) : (
    <StatusLight variant="negative">Disconnected from UXP</StatusLight>
  );

  return (
    <Router>
      <Flex direction="column" gap="size-100" height="100vh">
        <Flex
          direction="row"
          gap="size-100"
          alignItems="center"
          height="size-800"
        >
          {connectionStatusLight}
        </Flex>

        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Flex>
    </Router>
  );
};

export default App;
