import {
  showOpenDialog,
  factorySaveInstance,
  createFactory,
  factoryEnsureLayers,
  factoryEnsureOutputDir,
  getOutputDir,
  factoryLoadInstance,
  factoryInstance,
  factorySetProps,
  factoryGenerateRandomAttributesFromNodes,
  factoryGenerateImages,
  factoryDeployImages,
  getContract,
  factoryLoadSecrets,
  factoryDeployMetadata,
  factoryGenerateMetadata,
  // getContractSource,
} from "./ipc";
import { v4 as uuid } from "uuid";
import { ContractFactory, utils } from "ethers";

export const openDirectory = async () => {
  const { canceled, filePaths } = await showOpenDialog({
    properties: ["openFile", "openDirectory"],
  });
  if (canceled) return;
  const [inputDir] = filePaths;
  const outputDir = await getOutputDir(inputDir);

  return {
    inputDir,
    outputDir,
    photoshop: false,
  };
};

export const openInstance = async () => {
  const id = uuid();

  const { canceled, filePaths } = await showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Instance",
        extensions: ["json"],
      },
    ],
  });
  if (canceled) return;
  const [instancePath] = filePaths;

  await factoryLoadInstance(id, instancePath);
  const instance = await factoryInstance(id);

  return {
    id,
    instance,
  };
};

export const resolvePathFromInstance = (id, instance) => {
  const {
    inputDir,
    outputDir,
    attributes,
    generated,
    metadataGenerated,
    imagesCID,
    metadataCID,
    contractAddress,
    configuration,
    network,
    abi,
  } = instance;

  return !attributes && !generated
    ? [
        "/generation",
        { inputDir, outputDir, partialConfiguration: configuration },
      ]
    : !metadataGenerated && !imagesCID && !metadataCID && !contractAddress
    ? [
        "/quality",
        {
          id,
          attributes,
          inputDir,
          outputDir,
          photoshop: false,
          configuration,
        },
      ]
    : imagesCID && metadataCID && !contractAddress
    ? [
        "/deploy",
        {
          id,
          attributes,
          inputDir,
          outputDir,
          photoshop: false,
          configuration,
          partialDeploy: {
            imagesCID,
            metadataCID,
          },
        },
      ]
    : contractAddress
    ? [
        "/instance",
        {
          id,
          attributes,
          inputDir,
          outputDir,
          photoshop: false,
          configuration,
          imagesCID,
          metadataCID,
          network,
          contractAddress,
          abi,
        },
      ]
    : null;
};

export const initializeFactory = async (configuration, inputDir, outputDir) => {
  const id = uuid();

  await createFactory(id, configuration, inputDir, outputDir);
  await factorySaveInstance(id);
  await factoryEnsureLayers(id);
  await factoryEnsureOutputDir(id);

  return {
    id,
  };
};

export const filterNodes = (nodes) =>
  JSON.parse(
    JSON.stringify(
      nodes.map((node) =>
        node.type === "renderNode"
          ? {
              id: node.id,
              type: node.type,
              targetPosition: node.targetPosition,
              data: { n: node.data.n },
              position: node.position,
            }
          : node.type === "layerNode"
          ? {
              id: node.id,
              type: node.type,
              sourcePosition: node.sourcePosition,
              targetPosition: node.targetPosition,
              data: {
                layer: node.data.layer,
              },
              position: node.position,
            }
          : node
      )
    )
  );

export const computeN = (nodes) =>
  nodes.reduce((p, c) => p + (c.type === "renderNode" ? c.data.n : 0), 0);

export const factoryGenerate = async (
  id,
  configuration,
  layersNodes,
  onProgress
) => {
  await factorySetProps(id, { configuration });
  await factorySaveInstance(id);

  const attributes = await factoryGenerateRandomAttributesFromNodes(
    id,
    layersNodes
  );

  await factoryGenerateImages(id, attributes, onProgress);
  await factorySaveInstance(id);

  return {
    attributes,
  };
};

export const factoryDeployAssets = async (
  id,
  secrets,
  attributes,
  partialDeploy
) => {
  await factoryLoadSecrets(id, secrets);

  const imagesCID = partialDeploy
    ? partialDeploy.imagesCID
    : await factoryDeployImages(id);

  if (!partialDeploy) await factoryGenerateMetadata(id, imagesCID, attributes);

  const metadataCID = partialDeploy
    ? partialDeploy.metadataCID
    : await factoryDeployMetadata(id);

  await factorySetProps(id, {
    imagesCID,
    metadataCID,
  });

  return {
    imagesCID,
    metadataCID,
  };
};

export const deploy721 = async (contractFactory, configuration, metadataCID) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCID}/`,
    utils.parseEther(configuration.cost),
    configuration.n,
    configuration.maxMintAmount
  );

export const deploy1155 = async (contractFactory, configuration, metadataCID) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCID}/`
  );

export const factoryDeployContract = async (
  id,
  configuration,
  network,
  signer,
  metadataCID
) => {
  const { contracts } = await getContract(configuration.contractType);
  // const source = await getContractSource(configuration.contractType);

  const { NFT } = contracts[configuration.contractType];
  const metadata = JSON.parse(NFT.metadata);
  const { version: compilerVersion } = metadata.compiler;

  const { abi } = NFT;
  const { evm } = NFT;
  const { bytecode } = evm;
  const contractFactory = new ContractFactory(abi, bytecode, signer);

  const contract =
    configuration.contractType === "721"
      ? await deploy721(contractFactory, configuration, metadataCID)
      : await deploy1155(contractFactory, configuration, metadataCID);

  const contractAddress = contract.address;
  const transactionHash = contract.deployTransaction.hash;

  await factorySetProps(id, {
    network,
    contractAddress,
    abi,
    compilerVersion,
  });
  await factorySaveInstance(id);

  // ! TODO
  // await verifyContract(
  //   secrets.etherscanApiKey,
  //   source,
  //   network,
  //   contractAddress,
  //   "solidity-single-file",
  //   "NFT",
  //   version,
  //   0
  // );

  return {
    contractAddress,
    abi,
    compilerVersion,
    transactionHash,
    wait: contract.deployTransaction.wait(),
  };
};
