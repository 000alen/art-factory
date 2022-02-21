import React from "react";
import ReactDOM from "react-dom";
import {
  Provider as SpectrumProvider,
  defaultTheme,
} from "@adobe/react-spectrum";

import App from "./App";
import { SocketContext, socket } from "./components/SocketContext";

import "./index.css";

// ! TODO:
// Clean the local storage

ReactDOM.render(
  <SocketContext.Provider value={socket}>
    <SpectrumProvider theme={defaultTheme}>
      <App />
    </SpectrumProvider>
  </SocketContext.Provider>,
  document.getElementById("root")
);
