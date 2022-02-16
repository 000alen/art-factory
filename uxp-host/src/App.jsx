import { HomePage } from "./pages/HomePage";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { SocketContext } from "./components/SocketContext";
import { Flex, StatusLight } from "@adobe/react-spectrum";
import React, { useState, useEffect, useContext } from "react";
import { GenerationPage } from "./pages/GenerationPage";
import { QualityPage } from "./pages/QualityPage";
import { DeployPage } from "./pages/DeployPage";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { InstancePage } from "./pages/InstancePage";

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
          <Route path="/configuration" element={<ConfigurationPage />} />
          <Route path="/generation" element={<GenerationPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/deploy" element={<DeployPage />} />
          <Route path="/instance" element={<InstancePage />} />
        </Routes>
      </Flex>
    </Router>
  );
};

export default App;
