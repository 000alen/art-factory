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
import { OutputItem } from "../components/OutputItem";
import { useLocation, useNavigate } from "react-router-dom";
import { Networks } from "../constants";
import { Contract, providers } from "ethers";

import WalletConnectProvider from "@walletconnect/web3-provider";
import Copy from "@spectrum-icons/workflow/Copy";
import Close from "@spectrum-icons/workflow/Close";

import { Panel721 } from "../components/Panel721";
import { chopAddress, resolveEtherscanUrlII } from "../utils";
import LogOut from "@spectrum-icons/workflow/LogOut";
import { ToolbarContext } from "../components/Toolbar";
import { useErrorHandler } from "../components/ErrorHandler";
import { Instance } from "../typings";
import Back from "@spectrum-icons/workflow/Back";

interface InstancePageState {
  projectDir: string;
  instance: Instance;
  id: string;
}


export function InstancePage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id } = state as InstancePageState;
  const { configuration, deployment } = instance;

  const [isWorking, setIsWorking] = useState(false);
  const [contract, setContract] = useState(null);
  const [outputs, setOutputs] = useState([]);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", {
        state: {
          projectDir,
          instance,
          id,
        },
      })
    );
    toolbarContext.addButton("logOut", "Log Out", <LogOut />, () =>
      localStorage.clear()
    );

    // task("loading secrets", async () => {
    //   const secrets = await loadSecrets();
    //   const provider = new WalletConnectProvider({
    //     infuraId: secrets.infuraProjectId,
    //     chainId: Networks[network].id,
    //   });
    //   await provider.enable();
    //   const web3Provider = new providers.Web3Provider(provider);
    //   const signer = web3Provider.getSigner();
    //   const contract = new Contract(contractAddress, abi, signer);

    //   setContract(contract);
    // })();

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("back");
      toolbarContext.removeButton("logOut");
    };
  }, []);

  const addOutput = (output: {
    title: string;
    text: string;
    isCopiable: boolean;
  }) => {
    setOutputs((prevOutputs) => [...prevOutputs, output]);
  };

  const onCopy = () => {
    navigator.clipboard.writeText(deployment.contractAddress);
  };

  const _task =
    (name: string, callback: (...args: any[]) => void) =>
    async (...args: any[]) => {
      setIsWorking(true);
      await task(name, callback)(...args);
      setIsWorking(false);
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
            <pre className="inline">
              {chopAddress(deployment.contractAddress)}
            </pre>{" "}
            at {Networks[deployment.network].name}
          </Heading>
          <ActionButton onPress={onCopy}>
            <Copy />
          </ActionButton>
        </Flex>
        {/* <Link>
          <a
            href={resolveEtherscanUrlII(
              deployment.network,
              deployment.contractAddress
            )}
            target="_blank"
          >
            Contract at Etherscan.
          </a>
        </Link> */}
      </Flex>

      <Flex height="60vh" gap="size-100" justifyContent="space-evenly">
        {configuration.contractType === "721" ? (
          <Panel721
            {...{
              task: _task,
              contract,
              contractAddress: deployment.contractAddress,
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
