import { HomePage } from "./pages/HomePage";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import {
  Flex,
  StatusLight,
  DialogTrigger,
  ActionButton,
  Text,
} from "@adobe/react-spectrum";
import React, { useState, useEffect, useContext, createContext } from "react";
import { QualityPage } from "./pages/QualityPage";
import { DeployPage } from "./pages/DeployPage";
import { GenerationPage } from "./pages/GenerationPage";
import { InstancePage } from "./pages/InstancePage";
import { SocketContext } from "./components/SocketContext";
import { NotFoundPage } from "./pages/NotFoundPage";
import Settings from "@spectrum-icons/workflow/Settings";
import { SecretsDialog } from "./components/SecretsDialog";
import { GenericDialog } from "./components/GenericDialog";
import { NodesPage } from "./pages/NodesPage";

export const DialogContext = createContext();

export const ToolbarContext = createContext();

const ButtonItem = ({ label, icon, onClick }) => {
  return (
    <ActionButton onPress={() => onClick && onClick()}>
      {icon}
      {label && <Text>{label}</Text>}
    </ActionButton>
  );
};

const App = () => {
  const socket = useContext(SocketContext);

  const [connectionStatus, setConnectionStatus] = useState(false);

  const [dialogShown, setDialogShown] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("Lorem ipsum");
  const [dialogContent, setDialogContent] = useState("Lorem ipsum");
  const [dialogButtons, setDialogButtons] = useState(null);
  const [buttons, setButtons] = useState([]);

  useEffect(() => {
    socket.on("uxp-connected", (isUXPConnected) => {
      setConnectionStatus(isUXPConnected);
    });
  }, []);

  const showDialog = () => {
    setDialogShown(true);
  };

  const setDialog = (title, content, buttons, show) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogButtons(buttons);
    if (show) showDialog();
  };

  const hideDialog = () => {
    setDialogShown(false);
  };

  // {key, label, icon, onClick}
  const addButton = ({ key, label, icon, onClick }) => {
    setButtons((prevButtons) => [
      ...prevButtons,
      { key, label, icon, onClick },
    ]);
  };

  const removeButton = (key) => {
    setButtons((prevButtons) =>
      prevButtons.filter((button) => button.key !== key)
    );
  };

  return (
    <DialogContext.Provider value={{ showDialog, setDialog, hideDialog }}>
      <ToolbarContext.Provider value={{ addButton, removeButton }}>
        <Router>
          <Flex direction="column" height="100vh" gap="size-100">
            <DialogTrigger isOpen={dialogShown}>
              {null}
              <GenericDialog
                title={dialogTitle}
                text={dialogContent}
                buttons={dialogButtons}
                onHide={hideDialog}
              />
            </DialogTrigger>

            <Flex justifyContent="space-between" margin="size-100">
              {connectionStatus ? (
                <StatusLight variant="positive">UXP Connected</StatusLight>
              ) : (
                <StatusLight variant="negative">UXP Disconnected</StatusLight>
              )}

              <Flex direction="row-reverse" gap="size-100">
                <DialogTrigger>
                  <ActionButton>
                    <Settings />
                  </ActionButton>
                  {(close) => <SecretsDialog close={close} />}
                </DialogTrigger>
                {buttons.map((button) => (
                  <ButtonItem {...button} />
                ))}
              </Flex>
            </Flex>

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
      </ToolbarContext.Provider>
    </DialogContext.Provider>
  );
};

export default App;
