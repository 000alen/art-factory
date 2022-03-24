import React from "react";
import ReactDOM from "react-dom";
import {
  Provider as SpectrumProvider,
  defaultTheme,
  darkTheme,
} from "@adobe/react-spectrum";

import { App } from "./App";
import { socket, SocketContext } from "./components/SocketContext";
import { UXPContextProvider } from "./components/UXPContext";
import "./index.css";

ReactDOM.render(
  <SocketContext.Provider value={socket}>
    <UXPContextProvider>
      <SpectrumProvider theme={darkTheme}>
        <App />
      </SpectrumProvider>
    </UXPContextProvider>
  </SocketContext.Provider>,
  document.getElementById("root")
);
