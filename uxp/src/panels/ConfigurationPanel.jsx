import React, { useState, useContext, useRef } from "react";
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, setDefaultBackground] = useState("");
  const [n, setN] = useState(0);

  const asyncJob = () => {
    return new Promise(async (resolve, reject) => {
      await photoshop.core.executeAsModal(hideAll);

      const layers = doc.layers.map(
        (layer, i) => `${doc.layers.length - i}. ${layer.name}`
      ).reverse();

      return await photoshop.core.executeAsModal(async (executionControl) => {
        const userFolder = await uxp.storage.localFileSystem.getFolder();
        await exportAll(executionControl, userFolder);
        resolve({ userFolder, layers });
      });
    });
  };

  const onClickContinue = () => {
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

  return (
    <div>
      <WC className="flex flex-col" onInput={onInput}>
        <sp-textfield ref={nameRef} data-part="name" value={name}>
          <sp-label slot="label">Name</sp-label>
        </sp-textfield>

        <sp-textarea
          ref={descriptionRef}
          data-part="description"
          value={description}
        >
          <sp-label slot="label">Description</sp-label>
        </sp-textarea>

        <sp-textfield ref={symbolRef} data-part="symbol" value={symbol}>
          <sp-label slot="label">Symbol</sp-label>
        </sp-textfield>

        <sp-checkbox
          ref={generateBackgroundRef}
          data-part="generateBackground"
          value={generateBackground}
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

        <sp-textfield ref={nRef} data-part="n" value={n}>
          <sp-label slot="label">N</sp-label>
        </sp-textfield>
      </WC>

      <button onClick={onClickContinue}>Continue</button>

      {/* <WC onClick={onClickContinue}>
        <sp-button variant="cta">Continue!</sp-button>
      </WC> */}
    </div>
  );
};
