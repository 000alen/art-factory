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

  const contractTypeERC721 = useRef(null);
  const contractTypeERC1155 = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, setDefaultBackground] = useState("#");
  const [n, setN] = useState(10);
  
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);

  const [contractType, setContractType] = useState(true);

  const [maxMint, setMaxMint] = useState(20);
  const [cost, setCost] = useState(0.05);


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
        inputDir,
        configuration: {
          name,
          n,
          description,
          symbol,
          width: doc.width,
          height: doc.height,
          generateBackground,
          defaultBackground,
          layers,
          contractType: contractType ? "ERC721" : "ERC1155",

          ERC721: {
            maxMint,
            cost
          }

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
      case "generateBackground":
        setGenerateBackground(!generateBackground);
        break;

      case "contractTypeERC1155":
        setContractType(false);
        contractTypeERC721.current.checked = false;
        contractTypeERC1155.current.checked = true;
        break;
      
      case "contractTypeERC721":
        setContractType(true);
        contractTypeERC721.current.checked = true;
        contractTypeERC1155.current.checked = false;
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

      <sp-textfield /*ref={nRef}*/ data-part="width" value={width} type="number">
        <sp-label slot="label" isrequired="true">
          Width
        </sp-label>
      </sp-textfield>

      <sp-textfield /*ref={nRef}*/ data-part="height" value={height} type="number">
        <sp-label slot="label" isrequired="true">
          Height
        </sp-label>
      </sp-textfield>

      <sp-checkbox
        ref={generateBackgroundRef}
        data-part="generateBackground"
      >
        Generate Background
      </sp-checkbox>

      {generateBackground && 
        <sp-textfield
          ref={defaultBackgroundRef}
          data-part="defaultBackground"
          placeholder="#1E1E1E"
        >
          <sp-label slot="label">Default Background</sp-label>
        </sp-textfield>
      }

      <sp-label slot="label" isrequired="true">
          Contract standard
      </sp-label>


      <sp-checkbox
        ref={contractTypeERC721}
        data-part="contractTypeERC721"
        checked
      >
        ERC721
      </sp-checkbox>
      <sp-checkbox
        ref={contractTypeERC1155}
        data-part="contractTypeERC1155"
      >
        ERC1155
      </sp-checkbox>
      
      {contractType && 
        <sp-textfield
          required
          data-part="cost"
          placeholder="0.05"
          value={cost}
        >
          <sp-label slot="label">Cost</sp-label>
        </sp-textfield>
      }

      {contractType && 
        <sp-textfield
          required
          data-part="maxmint"
          placeholder="10"
          value={maxMint}
        >
          <sp-label slot="label">Max mint amount</sp-label>
        </sp-textfield>
      }
  

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
