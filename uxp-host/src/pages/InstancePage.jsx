import React, { useState, useContext, useEffect } from "react";
import {
  Flex,
  Heading,
  ProgressBar,
  View,
  Text,
  ActionButton,
} from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { OutputItem } from "../components/OutputItem";
import { useLocation, useNavigate } from "react-router-dom";
import { DialogContext, ToolbarContext } from "../App";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { Networks } from "../constants";
import { Contract, providers } from "ethers";

import WalletConnectProvider from "@walletconnect/web3-provider";
import { getInfuraId, getPinataApiKey, getPinataSecretApiKey } from "../ipc";
import Copy from "@spectrum-icons/workflow/Copy";
import Close from "@spectrum-icons/workflow/Close";

import { Panel721 } from "../components/Panel721";
import { chopAddress } from "../utils";
import { Panel1155 } from "../components/Panel1155";
import LogOut from "@spectrum-icons/workflow/LogOut";

// ! TODO: Implement, link to Etherscan
export function InstancePage() {
  const dialogContext = useContext(DialogContext);
  const toolbarContext = useContext(ToolbarContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    id,
    attributes,
    inputDir,
    outputDir,
    configuration,
    imagesCID,
    metadataCID,
    network,
    contractAddress,
    abi,
  } = state;

  const [secrets, setSecrets] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outputs, setOutputs] = useState([]);

  const loadSecrets = async () => ({
    pinataApiKey: await getPinataApiKey(),
    pinataSecretApiKey: await getPinataSecretApiKey(),
    infuraId: await getInfuraId(),
  });

  useEffect(() => {
    toolbarContext.addButton({
      key: "close",
      label: "Close",
      icon: <Close />,
      onClick: () => navigate("/"),
    });

    toolbarContext.addButton({
      key: "logOut",
      label: "Log Out",
      icon: <LogOut />,
      onClick: () => localStorage.clear(),
    });

    let _secrets;
    let _provider;
    let _contract;

    loadSecrets()
      .then((__secrets) => {
        _secrets = __secrets;

        _provider = new WalletConnectProvider({
          infuraId: _secrets.infuraId,
          chainId: Networks[network].id,
        });

        _provider.enable().then((_) => {
          const _web3Provider = new providers.Web3Provider(_provider);
          const _signer = _web3Provider.getSigner();

          _contract = new Contract(contractAddress, abi, _signer);

          setSecrets(_secrets);
          setProvider(_provider);
          setContract(_contract);
        });
      })
      .catch((error) => {
        dialogContext.setDialog("Error", error.message, null, true);
        return;
      });

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("logOut");
    };
  }, []);

  const addOutput = (output) => {
    setOutputs((prevOutputs) => [...prevOutputs, output]);
  };

  const onCopy = () => {
    navigator.clipboard.writeText(contractAddress);
  };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Flex gap="size-100" alignItems="center">
        <Heading level={1} marginStart={16}>
          <pre className="inline">{chopAddress(contractAddress)}</pre> at{" "}
          {Networks[network].name}
        </Heading>
        <ActionButton onPress={onCopy}>
          <Copy />
        </ActionButton>
      </Flex>

      <Flex height="70vh" gap="size-100" justifyContent="space-evenly">
        {configuration.contractType === "721" ? (
          <Panel721
            {...{
              contract,
              contractAddress,
              setIsLoading,
              addOutput,
              dialogContext,
            }}
          />
        ) : configuration.contractType === "1155" ? (
          <Panel1155
            {...{
              contract,
              contractAddress,
              setIsLoading,
              addOutput,
              dialogContext,
            }}
          />
        ) : null}

        <View>
          <label className="spectrum-FieldLabel">Output</label>

          <View
            width="30vw"
            height="100%"
            padding="size-100"
            overflow="auto"
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
          >
            <Flex direction="column" gap="size-100">
              {outputs.map(({ title, text, isCopiable }, i) => (
                <OutputItem
                  key={i}
                  title={title}
                  text={text}
                  isCopiable={isCopiable}
                />
              ))}
            </Flex>
          </View>
        </View>
      </Flex>

      <Flex marginBottom={8} marginX={8} justifyContent="space-between">
        <Text>Made with love by KODKOD ❤️</Text>

        <ProgressBar
          UNSAFE_className={isLoading ? "opacity-100" : "opacity-0"}
          label="Loading…"
          isIndeterminate
        />
      </Flex>
    </Flex>
  );
}
