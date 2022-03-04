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
  isValidInputDir,
  // getContractSource,
} from "./ipc";
import { v4 as uuid } from "uuid";
import { ContractFactory, utils } from "ethers";
import { FormattedError } from "./components/ErrorHandler";

export const openDirectory = async () => {
  const { canceled, filePaths } = await showOpenDialog({
    properties: ["openFile", "openDirectory"],
  });
  if (canceled) return;
  const [inputDir] = filePaths;

  if (!(await isValidInputDir(inputDir)))
    throw FormattedError(7, "Invalid input directory", { inputDir });

  const outputDir = await getOutputDir(inputDir);

  return {
    inputDir,
    outputDir,
    photoshopId: undefined,
    photoshop: false,
  };
};

export const openInstance = async () => {
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

  const id = uuid();
  try {
    await factoryLoadInstance(id, instancePath);
  } catch (error) {
    throw FormattedError(1, "Could not load instance", {
      instancePath,
      message: error.message,
    });
  }

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
        "/configuration",
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
          photoshopId: undefined,
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
          photoshopId: undefined,
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
          photoshopId: undefined,
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

  try {
    await createFactory(id, configuration, inputDir, outputDir);
    await factorySaveInstance(id);
    await factoryEnsureLayers(id);
    await factoryEnsureOutputDir(id);
  } catch (error) {
    throw FormattedError(2, "Could not initialize factory", {
      configuration,
      inputDir,
      outputDir,
      message: error.message,
    });
  }

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

  try {
    await factoryGenerateImages(id, attributes, onProgress);
  } catch (error) {
    throw FormattedError(3, "Could not generate images", {
      attributes,
      message: error.message,
    });
  }
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
  let imagesCID, metadataCID;

  await factoryLoadSecrets(id, secrets);

  try {
    imagesCID = partialDeploy
      ? partialDeploy.imagesCID
      : await factoryDeployImages(id);

    if (!partialDeploy)
      await factoryGenerateMetadata(id, imagesCID, attributes);

    metadataCID = partialDeploy
      ? partialDeploy.metadataCID
      : await factoryDeployMetadata(id);
  } catch (error) {
    throw FormattedError(4, "Could not deploy assets", {
      attributes,
      imagesCID,
      metadataCID,
      message: error.message,
    });
  }

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
  let contracts;
  // let source;
  try {
    ({ contracts } = await getContract(configuration.contractType));
    // source = await getContractSource(configuration.contractType);
  } catch (error) {
    throw FormattedError(5, "Could not get contract", {
      configuration,
      message: error.message,
    });
  }

  const { NFT } = contracts[configuration.contractType];
  const metadata = JSON.parse(NFT.metadata);
  const { version: compilerVersion } = metadata.compiler;

  const { abi } = NFT;
  const { evm } = NFT;
  const { bytecode } = evm;
  const contractFactory = new ContractFactory(abi, bytecode, signer);

  let contract;
  try {
    contract =
      configuration.contractType === "721"
        ? await deploy721(contractFactory, configuration, metadataCID)
        : await deploy1155(contractFactory, configuration, metadataCID);
  } catch (error) {
    throw FormattedError(6, "Could not deploy contract", {
      configuration,
      message: error.message,
    });
  }

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
