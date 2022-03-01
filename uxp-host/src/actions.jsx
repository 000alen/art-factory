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
} from "./ipc";
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
