import "@spectrum-css/fieldlabel/dist/index-vars.css";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom";

import { darkTheme, Provider as SpectrumProvider } from "@adobe/react-spectrum";

import { App } from "./App";
import { socket, SocketContext } from "./components/SocketContext";
import { UXPContextProvider } from "./components/UXPContext";

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
