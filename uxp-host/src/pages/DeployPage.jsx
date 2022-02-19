import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  Button,
  TextField,
  Flex,
  ButtonGroup,
  Heading,
} from "@adobe/react-spectrum";
import {
  factoryDeployImages,
  factoryDeployMetadata,
  factoryLoadSecrets,
  getContract,
  getInfuraId,
  getPinataApiKey,
  getPinataSecretApiKey,
} from "../ipc";
import { providers, ContractFactory, ethers } from "ethers";
import { DialogContext } from "../App";

export function DeployPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, attributes, inputDir, outputDir, configuration } = state;

  const [provider, setProvider] = useState(null);
  const [web3Provider, setWeb3Provider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [imagesCID, setImagesCID] = useState("");
  const [metadataCID, setMetadataCID] = useState("");

  useEffect(() => {
    // TODO
    const _provider = new WalletConnectProvider({
      infuraId: "50adf8db20234b2d80ea3f1e23acef34",
      chainId: 3,
    });

    setProvider(_provider);
  }, []);

  const onDeploy = async () => {
    // TODO
    // await provider.enable();
    // const _web3Provider = new providers.Web3Provider(provider);
    // const _signer = await _web3Provider.getSigner();
    // setWeb3Provider(_web3Provider);
    // setSigner(_signer);

    let secrets;
    let _imagesCID;
    let _metadataCID;

    // ! TODO
    try {
      secrets = {
        pinataApiKey: await getPinataApiKey(),
        pinataSecretApiKey: await getPinataSecretApiKey(),
        infuraId: await getInfuraId(),
      };
      await factoryLoadSecrets(id, secrets);
      _imagesCID = await factoryDeployImages(id);
      _metadataCID = await factoryDeployMetadata(id);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    setImagesCID(_imagesCID);
    setMetadataCID(_metadataCID);

    // TODO
    // const { contracts } = await getContract("NFT");
    // const { NFT } = contracts.NFT;
    // const { abi, evm } = NFT;
    // const { bytecode } = evm;
    // const { object } = bytecode;
    // const factory = new ContractFactory(abi, object, signer);
    // console.log("Starting");
    // try {
    //   const contract = await factory.deploy(
    //     configuration.name,
    //     configuration.symbol,
    //     "x",
    //     "y",
    //     {
    //       gasPrice: ethers.utils.parseUnits("10", "gwei"),
    //     }
    //   );
    //   console.log("Waiting for transaction to be mined...");
    //   await contract.deployTransaction.wait();
    //   console.log("Transaction mined!");
    // } catch (err) {
    //   console.log(err);
    // }
  };

  return (
    <Flex direction="column" height="100%" margin="size-100" gap="size-100">
      <Heading level={1} marginStart={16}>
        Deploy
      </Heading>

      <Flex
        direction="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <TextField
          isReadOnly={true}
          value={imagesCID}
          label="Images CID"
        ></TextField>
        <TextField
          isReadOnly={true}
          value={metadataCID}
          label="Metadata CID"
        ></TextField>
        <TextField isReadOnly={true} label="Contract Address"></TextField>
      </Flex>

      <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
        <Button variant="cta" onPress={onDeploy}>
          Deploy!
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
