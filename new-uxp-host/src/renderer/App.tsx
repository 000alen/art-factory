import { HomePage } from "./pages/HomePage";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Flex, StatusLight } from "@adobe/react-spectrum";
import { QualityPage } from "./pages/QualityPage";
import { DeployPage } from "./pages/DeployPage";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { InstancePage } from "./pages/InstancePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NodesPage } from "./pages/NodesPage";

import React, { useContext } from "react";
import { Toolbar } from "./components/Toolbar";
import { UXPContext } from "./components/UXPContext";

export function App() {
  const { connectionStatus } = useContext(UXPContext);

  return (
    <Router>
      <Flex direction="column" height="100vh" gap="size-100">
        <Toolbar>
          {connectionStatus ? (
            <StatusLight variant="positive"> UXP Connected </StatusLight>
          ) : (
            <StatusLight variant="negative"> UXP Disconnected </StatusLight>
          )}
        </Toolbar>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/configuration" element={<ConfigurationPage />} />
          <Route path="/nodes" element={<NodesPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/deploy" element={<DeployPage />} />
          <Route path="/instance" element={<InstancePage />} />
          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
      </Flex>
    </Router>
  );
}
