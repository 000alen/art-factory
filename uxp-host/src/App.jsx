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
import { ReviewPage } from "./pages/ReviewPage";

const App = () => {
  // const navigator = useNavigate();

  const socket = useContext(SocketContext);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [x, setX] = useState(false);

  useEffect(() => {
    socket.on("uxp-connected", (isUXPConnected) => {
      setConnectionStatus(isUXPConnected);
    });

    socket.on("uxp-generate", ({ n, inputDir, outputDir, configuration }) => {
      console.log({
        n,
        inputDir,
        outputDir,
        configuration,
      });
      setX(true);

      // navigator("/generate", {
      //   state: {
      //     n,
      //     inputDir,
      //     outputDir,
      //     configuration,
      //   },
      // });
    });
  }, []);

  const connectionStatusLight = connectionStatus ? (
    <StatusLight variant="positive">Connected to UXP</StatusLight>
  ) : (
    <StatusLight variant="negative">Disconnected from UXP</StatusLight>
  );

  return (
    <Router>
      {/* {connectionStatusLight} */}

      {x ? <div>RECIBIDO</div> : <></>}

      <Flex direction="column" gap="size-100" height="100vh">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/configuration" element={<ConfigurationPage />} />
          <Route path="/generation" element={<GenerationPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/deploy" element={<DeployPage />} />
          <Route path="/instance" element={<InstancePage />} />
        </Routes>
      </Flex>
    </Router>
  );
};

export default App;
