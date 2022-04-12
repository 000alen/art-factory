import {
  showOpenDialog,
  createFactory,
  getOutputDir,
  factoryGenerateImages,
  factoryDeployImages,
  getContract,
  factoryLoadSecrets,
  factoryDeployMetadata,
  factoryGenerateMetadata,
  isValidInputDir,
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
  ContractType,
  Instance,
  Network,
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

export const initializeFactory = async (
  configuration: Partial<Configuration>,
  projectDir: string
) => {
  const id = uuid();

  try {
    await createFactory(id, configuration, projectDir);
  } catch (error) {
    throw FormattedError(2, "Could not initialize factory", {
      // configuration,
      projectDir,
      message: error.message,
    });
  }

  return {
    id,
  };
};

export const factoryDeployAssets = async (
  id: string,
  secrets: Secrets,
  name: string,
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

    if (!partialDeploy) await factoryGenerateMetadata(id, name, collection);

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

  return {
    imagesCid,
    metadataCid,
    notRevealedImageCid,
    notRevealedMetadataCid,
  };
};

export const deploy721 = async (
  contractFactory: ContractFactory,
  configuration: Configuration,
  metadataCid: string
) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCid}/`,
    utils.parseEther(`${configuration.cost}`),
    10, // configuration.n, // ! TODO
    configuration.maxMintAmount
  );

export const deploy721_reveal_pause = async (
  contractFactory: ContractFactory,
  configuration: Configuration,
  metadataCid: string,
  notRevealedImageCid: string
) =>
  await contractFactory.deploy(
    configuration.name,
    configuration.symbol,
    `ipfs://${metadataCid}/`,
    `ipfs://${notRevealedImageCid}`,
    utils.parseEther(`${configuration.cost}`),
    10, // configuration.n, // ! TODO
    configuration.maxMintAmount
  );

export const factoryDeployContract = async (
  id: string,
  configuration: Configuration,
  network: Network,
  signer: Signer,
  metadataCid: string,
  notRevealedMetadataCid: string
) => {
  let contracts;
  try {
    ({ contracts } = await getContract(configuration.contractType));
  } catch (error) {
    throw FormattedError(5, "Could not get contract", {
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
      configuration.contractType === ContractType.ERC721
        ? await deploy721(contractFactory, configuration, metadataCid)
        : configuration.contractType === ContractType.ERC721_REVEAL_PAUSE
        ? await deploy721_reveal_pause(
            contractFactory,
            configuration,
            metadataCid,
            notRevealedMetadataCid
          )
        : null;
    // : await deploy1155(
    //     contractFactory,
    //     configuration as Configuration1155,
    //     metadataCid
    //   );
  } catch (error) {
    throw FormattedError(6, "Could not deploy contract", {
      // configuration,
      message: error.message,
    });
  }

  const contractAddress = contract.address;
  const transactionHash = contract.deployTransaction.hash;

  return {
    contractAddress,
    abi,
    compilerVersion,
    transactionHash,
    wait: contract.deployTransaction.wait(),
  };
};
