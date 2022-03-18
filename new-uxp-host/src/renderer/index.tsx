import React from "react";
import ReactDOM from "react-dom";
import {
  Provider as SpectrumProvider,
  defaultTheme,
} from "@adobe/react-spectrum";

import { App } from "./App";
import { SocketContext } from "./components/SocketContext";
import { UXPContextProvider } from "./components/UXPContext";
import "./index.css";

ReactDOM.render(
  // <SocketContext.Provider value={socket}>
  <SocketContext.Provider value={null}>
    <UXPContextProvider>
      <SpectrumProvider theme={defaultTheme}>
        <App />
      </SpectrumProvider>
    </UXPContextProvider>
  </SocketContext.Provider>,
  document.getElementById("root")
);
