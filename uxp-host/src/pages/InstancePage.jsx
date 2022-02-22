import React, { useState, useContext, useEffect, useMemo } from "react";
import {
  Flex,
  Heading,
  TextField,
  NumberField,
  ProgressBar,
  View,
  Text,
} from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { TaskItem } from "../components/TaskItem";
import { OutputItem } from "../components/OutputItem";
import { useLocation, useNavigate } from "react-router-dom";
import { DialogContext } from "../App";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { Networks } from "../constants";
import { Contract, providers } from "ethers";

import WalletConnectProvider from "@walletconnect/web3-provider";
import { getInfuraId, getPinataApiKey, getPinataSecretApiKey } from "../ipc";

const chopAddress = (address) =>
  address.substring(0, 5) + "(...)" + address.substring(address.length - 3);

// ! TODO:
// Implement, link to Etherscan
export function InstancePage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
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
    let _secrets;
    let _provider;
    let _contract;

    loadSecrets()
      .then((__secrets) => {
        _secrets = __secrets;

        console.log(_secrets.infuraId, Networks[network].id);

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
  }, []);

  const addOutput = (output) => {
    setOutputs((prevOutputs) => [...prevOutputs, output]);
  };

  const onCost = async () => {
    setIsLoading(true);
    const cost = await contract.cost();
    addOutput({
      title: "Cost",
      text: cost.toString(),
      isCopiable: true,
    });
    setIsLoading(false);
  };

  const onIsRevealed = async () => {
    setIsLoading(true);
    const revealed = await contract.revealed();
    addOutput({
      title: "Is revealed?",
      text: revealed.toString(),
      isCopiable: true,
    });
    setIsLoading(false);
  };

  const onBalanceOf = async ({ address }) => {
    if (!address) return;

    setIsLoading(true);
    const balance = await contract.balanceOf(address);
    addOutput({
      title: `Balance of ${chopAddress(address)}`,
      text: balance.toString(),
      isCopiable: true,
    });
    setIsLoading(false);
  };

  const onTokenOfOwnerByIndex = async ({ address, index }) => {
    if (!address || !index) return;

    setIsLoading(true);

    const n = await contract.tokenOfOwnerByIndex(address, index);

    addOutput({
      title: "Token of owner by index",
      text: n.toString(),
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onTokenURI = async ({ index }) => {
    if (!index) return;

    setIsLoading(true);

    const uri = await contract.tokenURI(index);

    addOutput({
      title: "Token URI",
      text: uri,
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onReveal = async () => {
    setIsLoading(true);
    const tx = await contract.reveal();
    const receipt = await tx.wait();

    // console.log(tx, receipt);

    setIsLoading(false);
  };

  const onMint = async ({ payable, mint }) => {
    if (!payable || !mint) return;

    setIsLoading(true);

    const tx = await contract.mint(payable, mint);
    const receipt = await tx.wait();

    // addOutput({
    //   title: "Mint",
    //   text: " ",
    //   isCopiable: true,
    // });

    setIsLoading(false);
  };

  // https://ropsten.etherscan.io/address/0x174111F85ca26f222f61CcDeFDcf181E2D9093F5#readContract

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Heading level={1} marginStart={16}>
        Instance
      </Heading>

      <Flex height="70vh" gap="size-100" justifyContent="space-evenly">
        <Flex direction="column" gap="size-100">
          <TaskItem task="Cost" onRun={onCost} />
          <TaskItem task="Is revealed?" onRun={onIsRevealed} />
          <TaskItem
            task="Balance of"
            onRun={onBalanceOf}
            fields={[
              {
                key: "address",
                type: "address",
                label: "Address",
              },
            ]}
          />

          <TaskItem
            task="Token of owner by index"
            onRun={onTokenOfOwnerByIndex}
            fields={[
              {
                key: "address",
                type: "address",
                label: "Address",
              },
              {
                key: "index",
                type: "int",
                label: "Index",
              },
            ]}
          />

          <TaskItem
            task="Token URI"
            onRun={onTokenURI}
            fields={[
              {
                key: "index",
                type: "int",
                label: "Token Index",
              },
            ]}
          />
        </Flex>

        <Flex direction="column" gap="size-100">
          <TaskItem task="Reveal" onRun={onReveal} />

          <TaskItem
            task="Mint"
            onRun={onMint}
            fields={[
              {
                key: "payable",
                type: "string",
                label: "Payable amount",
              },
              {
                key: "mint",
                type: "int",
                label: "Mint amount",
              },
            ]}
          />

          <TaskItem task="Set cost">
            <NumberField label="Cost" />
          </TaskItem>

          <TaskItem task="Set max Mint amount">
            <NumberField label="Max Mint amount" />
          </TaskItem>

          <TaskItem task="Withdrawal">
            <NumberField label="Amount" />
          </TaskItem>
        </Flex>

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

      <Flex marginBottom={8} marginX={8} justifyContent="end">
        {isLoading ? (
          <ProgressBar label="Loading…" isIndeterminate />
        ) : (
          <Text>Made with love ❤️</Text>
        )}
      </Flex>
    </Flex>
  );
}
