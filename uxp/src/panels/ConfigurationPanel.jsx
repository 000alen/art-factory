import React, { useState, useContext, useRef, useEffect } from "react";
import { hideAll, exportAll } from "../jobs";
import { SocketContext } from "../components/SocketContext";
import { WC } from "../components/WC";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const doc = app.activeDocument;

export const ConfigurationPanel = () => {
  const socket = useContext(SocketContext);

  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const symbolRef = useRef(null);
  const generateBackgroundRef = useRef(null);
  const defaultBackgroundRef = useRef(null);
  const nRef = useRef(null);
  const continueRef = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, setDefaultBackground] = useState("#1e1e1e");
  const [n, setN] = useState(10);

  useEffect(() => {
    socket.on("connect_error", () => {
      socket.emit("reconnect", true);
      setConnectionStatus(false);
    });

    socket.on("server-connection", (connection) => {
      socket.emit("uxp-connected", true);
      setConnectionStatus(true);
    });
  }, []);

  const asyncJob = () => {
    return new Promise(async (resolve, reject) => {
      await photoshop.core.executeAsModal(hideAll);

      const layers = doc.layers
        .map((layer, i) => `${doc.layers.length - i}. ${layer.name}`)
        .reverse();

      return await photoshop.core.executeAsModal(async (executionControl) => {
        const userFolder = await uxp.storage.localFileSystem.getFolder();
        await exportAll(executionControl, userFolder);
        resolve({ userFolder, layers });
      });
    });
  };

  const onClickContinue = () => {
    if (!connectionStatus) return;

    asyncJob().then(({ userFolder, layers }) => {
      const inputDir = userFolder.nativePath;
      socket.emit("uxp-generate", {
        n,
        inputDir,
        configuration: {
          name,
          description,
          symbol,
          width: doc.width,
          height: doc.height,
          generateBackground,
          defaultBackground,
          layers,
        },
      });
    });
  };

  const onInput = (event) => {
    if (event._reactName === undefined) return;

    const target = event.target;
    const part = target.getAttribute("data-part");

    switch (part) {
      case "name":
        setName(target.value);
        break;
      case "description":
        setDescription(target.value);
        break;
      case "symbol":
        setSymbol(target.value);
        break;
      case "generateBackground":
        setGenerateBackground(target.checked);
        break;
      case "defaultBackground":
        setDefaultBackground(target.value);
        break;
      case "n":
        setN(target.value);
        break;
      default:
        break;
    }
  };

  const onClick = (event) => {
    if (event._reactName === undefined) return;

    const target = event.target;
    const part = target.getAttribute("data-part");

    switch (part) {
      case "continue":
        onClickContinue();
        break;
      default:
        break;
    }
  };

  return (
    <WC className="flex flex-col space-y-2" onInput={onInput} onClick={onClick}>
      <div className="flex flex-row space-x-1 items-center">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus ? "bg-green-600" : "bg-red-600"
          }`}
        />
        <sp-body size="xs">
          {connectionStatus ? "Connected" : "Disconnected"}
        </sp-body>
      </div>

      <sp-textfield ref={nameRef} data-part="name" value={name}>
        <sp-label slot="label" isrequired="true">
          Name
        </sp-label>
      </sp-textfield>

      <sp-textarea
        ref={descriptionRef}
        data-part="description"
        value={description}
      >
        <sp-label slot="label" isrequired="true">
          Description
        </sp-label>
      </sp-textarea>

      <sp-textfield ref={symbolRef} data-part="symbol" value={symbol}>
        <sp-label slot="label" isrequired="true">
          Symbol
        </sp-label>
      </sp-textfield>

      <sp-checkbox
        ref={generateBackgroundRef}
        data-part="generateBackground"
        checked={generateBackground}
      >
        Generate Background
      </sp-checkbox>

      <sp-textfield
        ref={defaultBackgroundRef}
        data-part="defaultBackground"
        value={defaultBackground}
      >
        <sp-label slot="label">Default Background</sp-label>
      </sp-textfield>

      <sp-textfield ref={nRef} data-part="n" value={n} type="number">
        <sp-label slot="label" isrequired="true">
          N
        </sp-label>
      </sp-textfield>

      <sp-button ref={continueRef} data-part="continue" variant="cta">
        Continue!
      </sp-button>
    </WC>
  );
};
