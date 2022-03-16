import {
  showOpenDialog,
  factorySaveInstance,
  createFactory,
  factoryEnsureLayers,
  factoryEnsureOutputDir,
  getOutputDir,
  factoryLoadInstance,
  factoryInstance,
  factoryLoadProps,
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
import { ContractFactory, Signer, utils } from "ethers";
import { FormattedError } from "./components/ErrorHandler";

export const openDirectory = async () => {
  const { canceled, filePaths } = (await showOpenDialog({
    properties: ["openFile", "openDirectory"],
  })) as {
    canceled: boolean;
    filePaths: string[];
  };
  if (canceled) return;
  const [inputDir] = filePaths;

  if (!(await isValidInputDir(inputDir)))
    throw FormattedError(7, "Invalid input directory", { inputDir });

  const outputDir = await getOutputDir(inputDir);

  return {
    inputDir,
    outputDir,
    photoshopId: "",
    photoshop: false,
  };
};

export const openInstance = async () => {
  const { canceled, filePaths } = (await showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Instance",
        extensions: ["json"],
      },
    ],
  })) as {
    canceled: boolean;
    filePaths: string[];
  };
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

export const resolvePathFromInstance = (id: string, instance: any) => {
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
          photoshopId: "",
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
          photoshopId: "",
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
          photoshopId: "",
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

export const initializeFactory = async (
  configuration: any,
  inputDir: string,
  outputDir: string
) => {
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

export const filterNodes = (nodes: any[]) =>
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
                opacity: node.data.opacity,
                blending: node.data.blending,
              },
              position: node.position,
            }
          : node
      )
    )
  );

export const computeN = (nodes: any[]) =>
  nodes.reduce((p, c) => p + (c.type === "renderNode" ? c.data.n : 0), 0);

export const factoryGenerate = async (
  id: string,
  configuration: any,
  layersNodes: any[],
  onProgress: (i: number) => void
) => {
  await factoryLoadProps(id, { configuration });
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
  id: string,
  secrets: Record<string, string>,
  attributes: any[],
  partialDeploy: any
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

  await factoryLoadProps(id, {
    imagesCID,
    metadataCID,
  });

  return {
    imagesCID,
    metadataCID,
  };
};

export const deploy721 = async (
  contractFactory: ContractFactory,
  configuration: any,
  metadataCID: string
) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCID}/`,
    utils.parseEther(configuration.cost),
    configuration.n,
    configuration.maxMintAmount
  );

export const deploy1155 = async (
  contractFactory: ContractFactory,
  configuration: any,
  metadataCID: string
) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCID}/`
  );

export const factoryDeployContract = async (
  id: string,
  configuration: any,
  network: string,
  signer: Signer,
  metadataCID: string
) => {
  let contracts;
  // let source;
  try {
    // @ts-ignore
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

  await factoryLoadProps(id, {
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
