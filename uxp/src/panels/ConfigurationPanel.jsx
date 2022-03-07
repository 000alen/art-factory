import React, { useState, useContext } from "react";
import { hideAll, exportAll } from "../jobs";
import { ConfigurationBase } from "../components/ConfigurationBase";
import { Configuration721 } from "../components/Configuration721";
import { Configuration1155 } from "../components/Configuration1155";
import { UXPContext } from "../components/UXPContext";
import { getDocument, getId, setDocument, setFolder } from "../store";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export const ConfigurationPanel = () => {
  const { connectionStatus, uxpGenerate } = useContext(UXPContext);

  // Base configuration
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [generateBackground, setGenerateBackground] = useState(false);
  const [defaultBackground, setDefaultBackground] = useState("#1e1e1e");
  const [contractType, setContractType] = useState("721");

  // 721 configuration
  const [maxMintAmount, setMaxMintAmount] = useState(20);
  const [cost, setCost] = useState(0.05);

  // 1155 configuration
  // ! TODO

  const asyncJob = async () =>
    new Promise((resolve, reject) =>
      photoshop.core.executeAsModal(async (executionContext) => {
        const id = getId();
        const doc = app.activeDocument;
        setDocument(id, doc.name);

        const folder = await fs.getFolder();
        const token = await fs.createPersistentToken(folder);
        setFolder(id, token);

        await hideAll(executionContext, doc);
        await exportAll(executionContext, doc, folder);

        // NOTE: It's already sorted
        const layers = doc.layers.map((layer) => layer.name).reverse();
        const inputDir = folder.nativePath;

        resolve({ id, layers, inputDir });
      })
    );
  const onContinue = async () => {
    if (!connectionStatus) return;

    const { id, layers, inputDir } = await asyncJob();
    const doc = getDocument(id);

    const partialConfiguration = {
      photoshopId: id,

      name,
      description,
      symbol,
      width: doc.width,
      height: doc.height,
      generateBackground,
      defaultBackground,
      contractType,

      ...(contractType === "721"
        ? {
            cost,
            maxMintAmount,
          }
        : contractType === "1155"
        ? {}
        : {}),

      layers,
    };

    uxpGenerate(id, inputDir, partialConfiguration);
  };

  return (
    <div className="flex flex-col space-y-2">
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

      <ConfigurationBase
        {...{
          name,
          setName,
          description,
          setDescription,
          symbol,
          setSymbol,
          generateBackground,
          setGenerateBackground,
          defaultBackground,
          setDefaultBackground,
          contractType,
          setContractType,
        }}
      />

      {contractType === "721" ? (
        <Configuration721
          {...{
            cost,
            setCost,
            maxMintAmount,
            setMaxMintAmount,
          }}
        />
      ) : contractType === "1155" ? (
        <Configuration1155 {...{}} />
      ) : null}

      <div className="flex justify-end">
        <sp-button variant="cta" onClick={onContinue}>
          Continue!
        </sp-button>
      </div>
    </div>
  );
};
