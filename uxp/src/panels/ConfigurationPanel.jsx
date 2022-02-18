import React, { useState, useContext } from "react";
import { hideAll, exportAll } from "../jobs";
import { SocketContext } from "../components/SocketContext";
import path from "path-browserify";

const uxp = require("uxp");
const photoshop = require("photoshop");

export const ConfigurationPanel = () => {
  const socket = useContext(SocketContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, setDefaultBackground] = useState("");
  const [n, setN] = useState(0);

  const asyncJob = () => {
    return new Promise(async (resolve, reject) => {
      await photoshop.core.executeAsModal(hideAll);
      return await photoshop.core.executeAsModal(async (executionControl) => {
        const userFolder = await uxp.storage.localFileSystem.getFolder();
        await exportAll(executionControl, userFolder);
        resolve(userFolder);
      });
    });
  };

  const onClickContinue = () => {
    asyncJob().then((inputFolder) => {
      const inputDir = inputFolder.nativePath;
      socket.emit("uxp-generate", {
        n,
        inputDir: inputDir,
        outputDir: inputDir,
        configuration: {
          name,
          description,
          symbol,
          generateBackground,
          defaultBackground,
        },
      });
      console.log("Emitió?");
    });
  };

  return (
    <div className="flex flex-col">
      <sp-textfield value={name} onChange={setName}>
        <sp-label slot="label">Name</sp-label>
      </sp-textfield>

      <sp-textarea value={description} onChange={setDescription}>
        <sp-label slot="label">Description</sp-label>
      </sp-textarea>

      <sp-textfield value={symbol} onChange={setSymbol}>
        <sp-label slot="label">Symbol</sp-label>
      </sp-textfield>

      <sp-checkbox value={generateBackground} onChange={setGenerateBackground}>
        Generate Background
      </sp-checkbox>

      <sp-textfield value={defaultBackground} onChange={setDefaultBackground}>
        <sp-label slot="label">Default Background</sp-label>
      </sp-textfield>

      <sp-textfield value={n} onChange={setN}>
        <sp-label slot="label">N</sp-label>
      </sp-textfield>

      <button onClick={onClickContinue}>Continue</button>

      {/* <WC onClick={onClickContinue}>
        <sp-button variant="cta">Continue!</sp-button>
      </WC> */}
    </div>
  );
};
