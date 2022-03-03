import { HomePage } from "./pages/HomePage";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Flex, StatusLight } from "@adobe/react-spectrum";
import React, { useContext } from "react";
import { QualityPage } from "./pages/QualityPage";
import { DeployPage } from "./pages/DeployPage";
import { GenerationPage } from "./pages/GenerationPage";
import { InstancePage } from "./pages/InstancePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { GenericDialogProvider } from "./components/GenericDialog";
import { NodesPage } from "./pages/NodesPage";
import { ToolbarProvider, Toolbar } from "./components/Toolbar";
import { UXPContext } from "./components/UXPContext";

const App = () => {
  const { connectionStatus } = useContext(UXPContext);

  return (
    <GenericDialogProvider>
      <ToolbarProvider autoPlace={false}>
        <Router>
          <Flex direction="column" height="100vh" gap="size-100">
            <Toolbar>
              {connectionStatus ? (
                <StatusLight variant="positive">UXP Connected</StatusLight>
              ) : (
                <StatusLight variant="negative">UXP Disconnected</StatusLight>
              )}
            </Toolbar>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/generation" element={<GenerationPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/deploy" element={<DeployPage />} />
              <Route path="/instance" element={<InstancePage />} />
              <Route path="/nodes" element={<NodesPage />} />
              <Route path="/*" element={<NotFoundPage />} />
            </Routes>
          </Flex>
        </Router>
      </ToolbarProvider>
    </GenericDialogProvider>
  );
};

export default App;
