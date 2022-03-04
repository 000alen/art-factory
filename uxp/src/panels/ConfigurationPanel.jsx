import React, { useState, useContext } from "react";
import { hideAll, exportAll } from "../jobs";
import { ConfigurationBase } from "../components/ConfigurationBase";
import { Configuration721 } from "../components/Configuration721";
import { Configuration1155 } from "../components/Configuration1155";
import { UXPContext } from "../components/UXPContext";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const doc = app.activeDocument;

export const ConfigurationPanel = () => {
  const { connectionStatus, uxpGenerate } = useContext(UXPContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [generateBackground, setGenerateBackground] = useState(false);
  const [defaultBackground, setDefaultBackground] = useState("#1e1e1e");

  const [contractType, setContractType] = useState("721");

  const [maxMintAmount, setMaxMintAmount] = useState(20);
  const [cost, setCost] = useState(0.05);

  const asyncJob = () => {
    return new Promise(async (resolve, reject) => {
      await photoshop.core.executeAsModal(hideAll);

      const layers = doc.layers
        .map((layer, i) => `${doc.layers.length - i}. ${layer.name}`)
        .reverse();

      await photoshop.core.executeAsModal(async (executionControl) => {
        const userFolder = await uxp.storage.localFileSystem.getFolder();
        await exportAll(executionControl, userFolder);
        resolve({ userFolder, layers });
      });
    });
  };

  const onContinue = async () => {
    if (!connectionStatus) return;

    const { userFolder, layers } = await asyncJob();
    const inputDir = userFolder.nativePath;

    const partialConfiguration = {
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

    uxpGenerate(inputDir, partialConfiguration);
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
