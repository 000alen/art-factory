import {
  showOpenDialog,
  factorySaveInstance,
  createFactory,
  getOutputDir,
  factoryLoadInstance,
  factoryInstance,
  factoryGenerateImages,
  factoryDeployImages,
  getContract,
  factoryLoadSecrets,
  factoryDeployMetadata,
  factoryGenerateMetadata,
  isValidInputDir,
  createFactoryFromInstance,
  factoryGenerateCollection,
} from "./ipc";
import { v4 as uuid } from "uuid";
import { ContractFactory, Signer, utils } from "ethers";
import { FormattedError } from "./components/ErrorHandler";
import {
  Collection,
  Configuration,
  Configuration1155,
  Configuration721,
  Instance,
  NodesAndEdges,
  Secrets,
} from "./typings";

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
    await createFactoryFromInstance(id, instancePath);
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
  } as {
    id: string;
    instance: Partial<Instance>;
  };
};

export const resolvePathFromInstance = (
  id: string,
  instance: Partial<Instance>
) => {
  const {
    inputDir,
    outputDir,
    attributes,
    generated,
    metadataGenerated,
    imagesCid,
    metadataCid,
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
    : !metadataGenerated && !imagesCid && !metadataCid && !contractAddress
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
    : imagesCid && metadataCid && !contractAddress
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
            imagesCID: imagesCid,
            metadataCID: metadataCid,
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
          imagesCID: imagesCid,
          metadataCID: metadataCid,
          network,
          contractAddress,
          abi,
        },
      ]
    : null;
};

export const initializeFactory = async (
  configuration: Partial<Configuration>,
  inputDir: string,
  outputDir: string
) => {
  const id = uuid();

  try {
    await createFactory(id, configuration, inputDir, outputDir);
    await factorySaveInstance(id);
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

export const filterNodes = (nodes: NodesAndEdges) =>
  JSON.parse(
    JSON.stringify(
      nodes.map((node) =>
        node.type in ["layerNode", "renderNode"]
          ? {
              id: node.id,
              type: node.type,
              data: {
                ...node.data,
                ...(node.type === "renderNode"
                  ? {
                      n: node.data.n,
                    }
                  : {
                      name: node.data.name,
                      opacity: node.data.opacity,
                      blending: node.data.blending,
                    }),
              },
            }
          : node
      )
    )
  );

// TODO
export const computeN = (nodes: NodesAndEdges) =>
  nodes.reduce(
    (n, node) => n + (node.type === "renderNode" ? node.data.n : 0),
    0
  );

export const factoryGenerate = async (
  id: string,
  configuration: Partial<Configuration>,
  nodesAndEdges: NodesAndEdges,
  onProgress: (name: string) => void
) => {
  // @ts-ignore
  await factoryLoadInstance(id, { configuration });
  await factorySaveInstance(id);

  const collection = await factoryGenerateCollection(id, nodesAndEdges);

  try {
    await factoryGenerateImages(id, collection, onProgress);
  } catch (error) {
    throw FormattedError(3, "Could not generate images", {
      collection,
      message: error.message,
    });
  }
  await factorySaveInstance(id);

  return {
    collection,
  };
};

export const factoryDeployAssets = async (
  id: string,
  secrets: Secrets,
  collection: Collection,
  partialDeploy: any
) => {
  let imagesCid, metadataCid;

  await factoryLoadSecrets(id, secrets);

  try {
    imagesCid = partialDeploy
      ? partialDeploy.imagesCID
      : await factoryDeployImages(id);

    if (!partialDeploy) await factoryGenerateMetadata(id);

    metadataCid = partialDeploy
      ? partialDeploy.metadataCID
      : await factoryDeployMetadata(id);
  } catch (error) {
    throw FormattedError(4, "Could not deploy assets", {
      collection,
      imagesCid,
      metadataCid,
      message: error.message,
    });
  }

  await factoryLoadInstance(id, {
    imagesCid,
    metadataCid,
  });

  return {
    imagesCid,
    metadataCid,
  };
};

export const deploy721 = async (
  contractFactory: ContractFactory,
  configuration: Configuration721,
  metadataCid: string
) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCid}/`,
    utils.parseEther(`${configuration.cost}`),
    configuration.n,
    configuration.maxMintAmount
  );

export const deploy1155 = async (
  contractFactory: ContractFactory,
  configuration: Configuration1155,
  metadataCid: string
) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCid}/`
  );

export const factoryDeployContract = async (
  id: string,
  configuration: Configuration,
  network: string,
  signer: Signer,
  metadataCid: string
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
        ? await deploy721(
            contractFactory,
            configuration as Configuration721,
            metadataCid
          )
        : await deploy1155(
            contractFactory,
            configuration as Configuration1155,
            metadataCid
          );
  } catch (error) {
    throw FormattedError(6, "Could not deploy contract", {
      configuration,
      message: error.message,
    });
  }

  const contractAddress = contract.address;
  const transactionHash = contract.deployTransaction.hash;

  await factoryLoadInstance(id, {
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
