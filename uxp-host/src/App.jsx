import { HomePage } from "./pages/HomePage";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import {
  Flex,
  StatusLight,
  DialogTrigger,
  Dialog,
  Heading,
  Divider,
  Content,
  Text,
  ButtonGroup,
  Button,
  ActionButton,
} from "@adobe/react-spectrum";
import React, { useState, useEffect, useContext, createContext } from "react";
import { QualityPage } from "./pages/QualityPage";
import { DeployPage } from "./pages/DeployPage";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { InstancePage } from "./pages/InstancePage";
import { SocketContext } from "./components/SocketContext";
import { NotFoundPage } from "./pages/NotFoundPage";
import Settings from "@spectrum-icons/workflow/Settings";
import { SecretsDialog } from "./components/SecretsDialog";

export const DialogContext = createContext();

const App = () => {
  const socket = useContext(SocketContext);

  const [connectionStatus, setConnectionStatus] = useState(false);
  const [dialogShown, setDialogShown] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("Lorem ipsum");
  const [dialogContent, setDialogContent] = useState("Lorem ipsum");
  const [dialogButtons, setDialogButtons] = useState(null);

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

  return (
    <DialogContext.Provider value={{ showDialog, setDialog, hideDialog }}>
      <Router>
        <Flex direction="column" gap="size-100" height="100vh">
          <DialogTrigger isOpen={dialogShown}>
            {null}
            <Dialog>
              <Heading>{dialogTitle}</Heading>
              <Divider />
              <Content>
                <Text>{dialogContent}</Text>
              </Content>

              <ButtonGroup>
                {dialogButtons === null ? (
                  <Button onPress={hideDialog}>Close</Button>
                ) : (
                  { dialogButtons }
                )}
              </ButtonGroup>
            </Dialog>
          </DialogTrigger>

          <Flex justifyContent="space-between" margin="size-100">
            {connectionStatus ? (
              <StatusLight variant="positive">Connected</StatusLight>
            ) : (
              <StatusLight variant="negative">Disconnected</StatusLight>
            )}

            <DialogTrigger>
              <ActionButton>
                <Settings />
              </ActionButton>
              {(close) => <SecretsDialog close={close} />}
            </DialogTrigger>
          </Flex>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/configuration" element={<ConfigurationPage />} />
            <Route path="/quality" element={<QualityPage />} />
            <Route path="/deploy" element={<DeployPage />} />
            <Route path="/instance" element={<InstancePage />} />
            <Route path="/*" element={<NotFoundPage />} />
          </Routes>
        </Flex>
      </Router>
    </DialogContext.Provider>
  );
};

export default App;
