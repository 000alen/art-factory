import { HomePage } from "./pages/HomePage";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Flex, StatusLight } from "@adobe/react-spectrum";
import { QualityPage } from "./pages/QualityPage";
import { DeployPage } from "./pages/DeployPage";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { InstancePage } from "./pages/InstancePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TemplatePage } from "./pages/TemplatePage";

import React, { useContext } from "react";
import { Toolbar, ToolbarProvider } from "./components/Toolbar";
import { UXPContext } from "./components/UXPContext";
import { GenericDialogProvider } from "./components/GenericDialog";
import { FactoryPage } from "./pages/FactoryPage";
import { GenerationPage } from "./pages/GenerationPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

export function App() {
  const { connectionStatus } = useContext(UXPContext);

  return (
    <GenericDialogProvider>
      <ToolbarProvider autoPlace={false}>
        <Router>
          <Flex direction="column" height="100vh" gap="size-100">
            <Toolbar>
              {connectionStatus ? (
                <StatusLight variant="positive"> UXP Connected </StatusLight>
              ) : (
                <StatusLight variant="negative"> UXP Disconnected </StatusLight>
              )}
            </Toolbar>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/factory" element={<FactoryPage />} />
                <Route path="/configuration" element={<ConfigurationPage />} />
                <Route path="/template" element={<TemplatePage />} />
                <Route path="/generation" element={<GenerationPage />} />
                <Route path="/quality" element={<QualityPage />} />
                <Route path="/deploy" element={<DeployPage />} />
                <Route path="/instance" element={<InstancePage />} />
                <Route path="/*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </Flex>
        </Router>
      </ToolbarProvider>
    </GenericDialogProvider>
  );
}
