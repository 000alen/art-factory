import React from "react";
import ReactDOM from "react-dom";
import {
  Provider as SpectrumProvider,
  defaultTheme,
} from "@adobe/react-spectrum";

import App from "./App";
import { SocketContext, socket } from "./components/SocketContext";

import "./index.css";
import { UXPContextProvider } from "./components/UXPContext";

ReactDOM.render(
  <SocketContext.Provider value={socket}>
    <UXPContextProvider>
      <SpectrumProvider theme={defaultTheme}>
        <App />
      </SpectrumProvider>
    </UXPContextProvider>
  </SocketContext.Provider>,
  document.getElementById("root")
);
