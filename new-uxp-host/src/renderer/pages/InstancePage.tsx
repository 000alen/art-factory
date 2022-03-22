import React, { useState, useContext, useEffect } from "react";
import {
  Flex,
  Heading,
  ProgressBar,
  View,
  Text,
  ActionButton,
  Link,
} from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { OutputItem } from "../components/OutputItem";
import { useLocation, useNavigate } from "react-router-dom";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { Networks } from "../constants";
import { Contract, providers } from "ethers";

import WalletConnectProvider from "@walletconnect/web3-provider";
import Copy from "@spectrum-icons/workflow/Copy";
import Close from "@spectrum-icons/workflow/Close";

import { Panel721 } from "../components/Panel721";
import { chopAddress } from "../utils";
import { Panel1155 } from "../components/Panel1155";
import LogOut from "@spectrum-icons/workflow/LogOut";
import { GenericDialogContext } from "../components/GenericDialog";
import { ToolbarContext } from "../components/Toolbar";
import { useErrorHandler } from "../components/ErrorHandler";
import { Configuration } from "../typings";
import { loadSecrets } from "../actions";

interface InstancePageState {
  configuration: Configuration;
  network: string;
  contractAddress: string;
  abi: any[];
}

function resolveEtherscanUrl(network: string, contractAddress: string) {
  return network === "mainnet"
    ? `https://etherscan.io/address/${contractAddress}`
    : network === "ropsten"
    ? `https://ropsten.etherscan.io/address/${contractAddress}`
    : network === "rinkeby"
    ? `https://rinkeby.etherscan.io/address/${contractAddress}`
    : null;
}

// ! TODO
// https://testnets.opensea.io/assets/<asset_contract_address>/<token_id>

export function InstancePage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const { task, isWorking } = useErrorHandler(genericDialogContext);
  const toolbarContext = useContext(ToolbarContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { configuration, network, contractAddress, abi } =
    state as InstancePageState;

  const [contract, setContract] = useState(null);
  const [outputs, setOutputs] = useState([]);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("logOut", "Log Out", <LogOut />, () =>
      localStorage.clear()
    );

    task("loading secrets", async () => {
      const secrets = await loadSecrets();
      const provider = new WalletConnectProvider({
        infuraId: secrets.infuraId,
        chainId: Networks[network].id,
      });
      await provider.enable();
      const web3Provider = new providers.Web3Provider(provider);
      const signer = web3Provider.getSigner();
      const contract = new Contract(contractAddress, abi, signer);

      setContract(contract);
    })();

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("logOut");
    };
  }, [abi, contractAddress, network]);

  const addOutput = (output: {
    title: string;
    text: string;
    isCopiable: boolean;
  }) => {
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
      <Flex justifyContent="space-between" alignItems="center">
        <Flex gap="size-100" alignItems="center">
          <Heading level={1} marginStart={16}>
            <pre className="inline">{chopAddress(contractAddress)}</pre> at{" "}
            {/* @ts-ignore */}
            {Networks[network].name}
          </Heading>
          <ActionButton onPress={onCopy}>
            <Copy />
          </ActionButton>
        </Flex>
        <Link>
          <a
            href={resolveEtherscanUrl(network, contractAddress)}
            target="_blank"
          >
            Contract at Etherscan.
          </a>
        </Link>
      </Flex>

      <Flex height="70vh" gap="size-100" justifyContent="space-evenly">
        {configuration.contractType === "721" ? (
          <Panel721
            {...{
              task,
              contract,
              contractAddress,
              addOutput,
            }}
          />
        ) : configuration.contractType === "1155" ? (
          <Panel1155
            {...{
              task,
              contract,
              contractAddress,
              addOutput,
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
          UNSAFE_className={isWorking ? "opacity-100" : "opacity-0"}
          label="Loading…"
          isIndeterminate
        />
      </Flex>
    </Flex>
  );
}
