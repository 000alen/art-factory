import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Button } from "@adobe/react-spectrum";
import { getContract } from "../ipcRenderer";
import { providers, ContractFactory, ethers } from "ethers";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DeployPage() {
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, toReview, attributes, inputDir, outputDir, configuration } =
    state;

  const [provider, setProvider] = useState(null);
  const [web3Provider, setWeb3Provider] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const _provider = new WalletConnectProvider({
      infuraId: "50adf8db20234b2d80ea3f1e23acef34",
      chainId: 3,
    });

    setProvider(_provider);
  }, []);

  const onClickConnect = async () => {
    await provider.enable();
    const _web3Provider = new providers.Web3Provider(provider);
    const _signer = await _web3Provider.getSigner();

    setWeb3Provider(_web3Provider);
    setSigner(_signer);
  };

  const onClickTest = async () => {
    const { contracts } = await getContract("NFT");

    const { NFT } = contracts.NFT;
    const { abi, evm } = NFT;
    const { bytecode } = evm;
    const { object } = bytecode;
    const factory = new ContractFactory(abi, object, signer);

    console.log("Starting");

    try {
      const contract = await factory.deploy(
        configuration.name,
        configuration.symbol,
        "x",
        "y",
        {
          gasPrice: ethers.utils.parseUnits("10", "gwei"),
        }
      );

      console.log("Waiting for transaction to be mined...");
      await contract.deployTransaction.wait();
      console.log("Transaction mined!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <Link to="/">Home</Link>
      <br />
      DeployPage
      <br />
      <Button onPress={onClickConnect}>Connect</Button>
      <br />
      <Button onPress={onClickTest}>Test</Button>
    </div>
  );
}
