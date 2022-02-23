import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  Button,
  TextField,
  Flex,
  ButtonGroup,
  Heading,
  ProgressBar,
  MenuTrigger,
  Menu,
  Item,
  ActionButton,
} from "@adobe/react-spectrum";
import {
  factoryDeployImages,
  factoryDeployMetadata,
  factoryGenerateMetadata,
  factoryLoadSecrets,
  factorySaveInstance,
  factorySetProps,
  getContract,
  getInfuraId,
  getPinataApiKey,
  getPinataSecretApiKey,
} from "../ipc";
import { providers, ContractFactory, utils } from "ethers";
import { DialogContext } from "../App";
import More from "@spectrum-icons/workflow/More";
import { Networks, ContractTypes } from "../constants";

// ! TODO:
// Choose the network to deploy and verify the contract
export function DeployPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, attributes, inputDir, outputDir, photoshop, configuration } =
    state;

  const [secrets, setSecrets] = useState(null);
  const [provider, setProvider] = useState(null);
  const [web3Provider, setWeb3Provider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [imagesCID, setImagesCID] = useState("");
  const [metadataCID, setMetadataCID] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedDone, setDeployedDone] = useState(false);
  const [networkKey, setNetworkKey] = useState("rinkeby");

  const loadSecrets = async () => ({
    pinataApiKey: await getPinataApiKey(),
    pinataSecretApiKey: await getPinataSecretApiKey(),
    infuraId: await getInfuraId(),
  });

  useEffect(() => {
    let _secrets;
    let _provider;

    loadSecrets()
      .then((__secrets) => {
        _secrets = __secrets;

        _provider = new WalletConnectProvider({
          infuraId: _secrets.infuraId,
          chainId: Networks[networkKey].id,
        });

        setSecrets(_secrets);
        setProvider(_provider);
      })
      .catch((error) => {
        dialogContext.setDialog("Error", error.message, null, true);
        return;
      });
  }, [networkKey]);

  const onDeploy = async () => {
    setIsDeploying(true);

    // TODO
    await provider.enable();
    const _web3Provider = new providers.Web3Provider(provider);
    const _signer = await _web3Provider.getSigner();

    let _imagesCID;
    let _metadataCID;

    setWeb3Provider(_web3Provider);
    setSigner(_signer);

    // ! TODO
    try {
      await factoryLoadSecrets(id, secrets);
      _imagesCID = await factoryDeployImages(id);
      await factoryGenerateMetadata(id, _imagesCID, attributes);
      _metadataCID = await factoryDeployMetadata(id);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);

      return;
    }

    await factorySaveInstance(id);
    setImagesCID(_imagesCID);
    setMetadataCID(_metadataCID);

    let _contractAddress;
    let _abi;

    // ! TODO
    try {
      const { contracts } = await getContract(configuration.contractType);
      const { NFT } = contracts[configuration.contractType];

      ({ abi: _abi } = NFT);
      const { evm } = NFT;
      const { bytecode } = evm;
      const contractFactory = new ContractFactory(_abi, bytecode, _signer);

      const contract =
        configuration.contractType === "721"
          ? await contractFactory.deploy(
              configuration.name,
              configuration.symbol,
              `ipfs://${_metadataCID}/`,
              `ipfs://${_metadataCID}/1.json`, // ! TODO
              utils.parseEther(configuration.cost),
              configuration.n,
              configuration.maxMintAmount,
              configuration.revealed
            )
          : await contractFactory.deploy(
              configuration.name,
              configuration.symbol,
              `ipfs://${_metadataCID}/`
            );

      _contractAddress = contract.address;

      await factorySetProps(id, {
        network: networkKey,
        contractAddress: _contractAddress,
        abi: _abi,
      });
      await factorySaveInstance(id);

      await contract.deployTransaction.wait();
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    setAbi(_abi);
    setContractAddress(_contractAddress);
    setIsDeploying(false);
    setDeployedDone(true);
  };

  const onContinue = async () => {
    await factorySetProps(id, {
      contractAddress,
    });
    await factorySaveInstance(id);

    navigator("/instance", {
      state: {
        id,
        attributes,
        inputDir,
        outputDir,
        photoshop,
        configuration,
        imagesCID,
        metadataCID,
        network: networkKey,
        contractAddress,
        abi,
      },
    });
  };

  return (
    <Flex direction="column" height="100%" margin="size-100" gap="size-100">
      <Flex gap="size-100" alignItems="center">
        <Heading level={1} marginStart={16}>
          Deploy {ContractTypes[configuration.contractType].name} to{" "}
          {Networks[networkKey].name}
        </Heading>
        <MenuTrigger>
          <ActionButton>
            <More />
          </ActionButton>
          <Menu
            selectionMode="single"
            selectedKeys={[networkKey]}
            onSelectionChange={(selectedKeys) =>
              setNetworkKey([...selectedKeys].shift())
            }
          >
            <Item key="mainnet">{Networks["mainnet"].name}</Item>
            <Item key="ropsten">{Networks["ropsten"].name}</Item>
            <Item key="rinkeby">{Networks["rinkeby"].name}</Item>
          </Menu>
        </MenuTrigger>
      </Flex>

      <Flex
        direction="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <TextField
          width="50%"
          isReadOnly={true}
          value={imagesCID}
          label="Images CID"
        />

        <TextField
          width="50%"
          isReadOnly={true}
          value={metadataCID}
          label="Metadata CID"
        />

        <TextField
          width="50%"
          isReadOnly={true}
          value={contractAddress}
          label="Contract Address"
        />
      </Flex>

      {isDeploying ? (
        <Flex marginBottom={8} marginX={8} justifyContent="end">
          <ProgressBar label="Deploying…" isIndeterminate />
        </Flex>
      ) : (
        <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
          {deployedDone ? (
            <Button
              variant="cta"
              onPress={onContinue}
              isDisabled={!contractAddress}
            >
              Continue!
            </Button>
          ) : (
            <Button variant="cta" onPress={onDeploy}>
              Deploy!
            </Button>
          )}
        </ButtonGroup>
      )}
    </Flex>
  );
}
