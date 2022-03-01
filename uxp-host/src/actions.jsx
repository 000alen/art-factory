import { showOpenDialog } from "./ipc";
import { getOutputDir, factoryLoadInstance, factoryInstance } from "./ipc";
import { v4 as uuid } from "uuid";

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
