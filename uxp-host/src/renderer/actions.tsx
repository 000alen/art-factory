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
  getPinataApiKey,
  getPinataSecretApiKey,
  getInfuraProjectId,
  getEtherscanApiKey,
  factoryDeployNotRevealedImage,
  factoryDeployNotRevealedMetadata,
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
  Secrets,
  Trait,
} from "./typings";

export const loadSecrets = async () =>
  ({
    pinataApiKey: ((await getPinataApiKey()) as unknown as string) || "",
    pinataSecretApiKey:
      ((await getPinataSecretApiKey()) as unknown as string) || "",
    infuraProjectId: ((await getInfuraProjectId()) as unknown as string) || "",
    etherscanApiKey: ((await getEtherscanApiKey()) as unknown as string) || "",
  } as Secrets);

export const createProject = async () => {};

export const openProject = async () => {
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
  };
};

// export const openDirectory = async () => {
//   const { canceled, filePaths } = (await showOpenDialog({
//     properties: ["openFile", "openDirectory"],
//   })) as {
//     canceled: boolean;
//     filePaths: string[];
//   };

//   if (canceled) return;
//   const [inputDir] = filePaths;

//   if (!(await isValidInputDir(inputDir)))
//     throw FormattedError(7, "Invalid input directory", { inputDir });

//   const outputDir = await getOutputDir(inputDir);

//   return {
//     inputDir,
//     outputDir,
//   };
// };

export const resolvePathFromInstance = (
  id: string,
  instance: Partial<Instance>
) => {
  const {
    inputDir,
    outputDir,
    collection,
    imagesGenerated,
    metadataGenerated,
    imagesCid,
    metadataCid,
    contractAddress,
    configuration,
    network,
    abi,
  } = instance;

  return !collection && !imagesGenerated
    ? [
        "/configuration",
        { inputDir, outputDir, partialConfiguration: configuration },
      ]
    : !metadataGenerated && !imagesCid && !metadataCid && !contractAddress
    ? [
        "/quality",
        {
          id,
          collection,
          inputDir,
          outputDir,
          configuration,
        },
      ]
    : imagesCid && metadataCid && !contractAddress
    ? [
        "/deploy",
        {
          id,
          collection,
          inputDir,
          outputDir,
          configuration,
          partialDeploy: {
            imagesCid,
            metadataCid,
          },
        },
      ]
    : contractAddress
    ? [
        "/instance",
        {
          id,
          collection,
          inputDir,
          outputDir,
          configuration,
          imagesCid,
          metadataCid,
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
      // configuration,
      inputDir,
      outputDir,
      message: error.message,
    });
  }

  return {
    id,
  };
};

export const factoryGenerate = async (
  id: string,
  configuration: Partial<Configuration>,
  keys: string[],
  nTraits: Trait[][],
  ns: Record<string, number>,
  nBundles: { name: string; ids: string[] }[],
  onProgress: (name: string) => void
) => {
  // @ts-ignore
  await factoryLoadInstance(id, { configuration });
  await factorySaveInstance(id);

  const { collection, bundles } = await factoryGenerateCollection(
    id,
    keys,
    nTraits,
    ns,
    nBundles
  );

  try {
    await factoryGenerateImages(id, collection, onProgress);
  } catch (error) {
    throw FormattedError(3, "Could not generate images", {
      // collection,
      message: error.message,
    });
  }
  await factorySaveInstance(id);

  return {
    collection,
    bundles,
  };
};

export const factoryDeployAssets = async (
  id: string,
  secrets: Secrets,
  collection: Collection,
  configuration: Configuration,
  partialDeploy: any
) => {
  let imagesCid, metadataCid, notRevealedImageCid, notRevealedMetadataCid;

  await factoryLoadSecrets(id, secrets);

  try {
    imagesCid = partialDeploy
      ? partialDeploy.imagesCid
      : await factoryDeployImages(id);

    if (!partialDeploy) await factoryGenerateMetadata(id);

    metadataCid = partialDeploy
      ? partialDeploy.metadataCid
      : await factoryDeployMetadata(id);

    notRevealedImageCid =
      configuration.contractType === "721_reveal_pause"
        ? ((await factoryDeployNotRevealedImage(id)) as string)
        : undefined;

    notRevealedMetadataCid =
      configuration.contractType === "721_reveal_pause"
        ? ((await factoryDeployNotRevealedMetadata(id)) as string)
        : undefined;
  } catch (error) {
    throw FormattedError(4, "Could not deploy assets", {
      // collection,
      imagesCid,
      metadataCid,
      message: error.message,
    });
  }

  await factoryLoadInstance(id, {
    imagesCid,
    metadataCid,
    notRevealedImageCid,
    notRevealedMetadataCid,
  });

  return {
    imagesCid,
    metadataCid,
    notRevealedImageCid,
    notRevealedMetadataCid,
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

export const deploy721_reveal_pause = async (
  contractFactory: ContractFactory,
  configuration: Configuration721,
  metadataCid: string,
  notRevealedImageCid: string
) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCid}/`,
    `ipfs://${notRevealedImageCid}`,
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
  metadataCid: string,
  notRevealedMetadataCid: string
) => {
  let contracts;
  // let source;
  try {
    // @ts-ignore
    ({ contracts } = await getContract(configuration.contractType));
    // source = await getContractSource(configuration.contractType);
  } catch (error) {
    throw FormattedError(5, "Could not get contract", {
      // configuration,
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
        : configuration.contractType === "721_reveal_pause"
        ? await deploy721_reveal_pause(
            contractFactory,
            configuration as Configuration721,
            metadataCid,
            notRevealedMetadataCid
          )
        : await deploy1155(
            contractFactory,
            configuration as Configuration1155,
            metadataCid
          );
  } catch (error) {
    throw FormattedError(6, "Could not deploy contract", {
      // configuration,
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

  // TODO
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
