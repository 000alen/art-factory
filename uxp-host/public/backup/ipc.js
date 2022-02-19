// const { ipcMain, dialog } = require("electron");
// const path = require("path");
// const solc = require("solc");
// const { Factory, loadInstance } = require("./art");
// const fs = require("fs");
// const {
//   setPinataApiKey,
//   getPinataApiKey,
//   setPinataSecretApiKey,
//   getPinataSecretApiKey,
//   setInfuraId,
//   getInfuraId,
// } = require("./store");

// // { error, result }
// const ipcTask = (task, callback) => {
//   ipcMain.on(task, (event, ...args) => {
//     let error = null;
//     let result = null;
//     try {
//       result = callback(...args);
//     } catch (_error) {
//       error = _error;
//     } finally {
//       event.reply(`${task}Result`, { error, result });
//     }
//   });
// };

// const ipcAsyncTask = (task, callback) => {
//   ipcMain.on(task, async (event, ...args) => {
//     let error = null;
//     let result = null;
//     try {
//       result = await callback(...args);
//     } catch (_error) {
//       error = _error;
//     } finally {
//       event.reply(`${task}Result`, { error, result });
//     }
//   });
// };

// const factories = {};

// ipcMain.on("writeFile", async (event, file, data, options) => {
//   await fs.promises.writeFile(file, data, options);
//   event.reply("writeFileResult", true);
// });

// ipcMain.on("mkDir", async (event, path, options) => {
//   await fs.promises.mkdir(path, options);
//   event.reply("mkDirResult", true);
// });

// ipcMain.on("showOpenDialog", async (event, options) => {
//   const result = await dialog.showOpenDialog(options);
//   event.reply("showOpenDialogResult", result);
// });

// ipcMain.on("showSaveDialog", async (event, options) => {
//   const result = await dialog.showSaveDialog(options);
//   event.reply("showSaveDialogResult", result);
// });

// ipcMain.on(
//   "createFactory",
//   (event, id, configuration, inputDir, outputDir, props) => {
//     const factory = new Factory(configuration, inputDir, outputDir);
//     if (props) {
//       const {
//         n,
//         attributes,
//         generated,
//         metadataGenerated,
//         imagesCID,
//         metadataCID,
//         contractAddress,
//       } = props;
//       factory.n = n;
//       factory.attributes = attributes;
//       factory.generated = generated;
//       factory.metadataGenerated = metadataGenerated;
//       factory.imagesCID = imagesCID;
//       factory.metadataCID = metadataCID;
//       factory.contractAddress = contractAddress;
//     }

//     factories[id] = factory;
//     event.reply("createFactoryResult", id);
//   }
// );

// ipcMain.on("factoryMaxCombinations", (event, id) => {
//   event.reply("factoryMaxCombinationsResult", factories[id].maxCombinations);
// });

// ipcMain.on("factoryInstance", (event, id) => {
//   event.reply("factoryInstanceResult", factories[id].instance);
// });

// ipcMain.on("factoryLoadSecrets", (event, id, secrets) => {
//   const factory = factories[id];
//   factory.loadSecrets(secrets);
//   event.reply("factoryLoadSecretsResult", true);
// });

// ipcMain.on("factorySaveInstance", async (event, id) => {
//   const factory = factories[id];
//   const instancePath = await factory.saveInstance();
//   event.reply("factorySaveInstanceResult", instancePath);
// });

// ipcMain.on("factoryLoadInstance", async (event, id, instancePath) => {
//   const factory = await loadInstance(instancePath);
//   factories[id] = factory;
//   event.reply("factoryLoadInstanceResult", id);
// });

// ipcMain.on("factoryEnsureLayers", async (event, id) => {
//   const factory = factories[id];
//   await factory.ensureLayers();
//   event.reply("factoryEnsureLayersResult", id);
// });

// ipcMain.on("factoryEnsureOutputDir", async (event, id) => {
//   const factory = factories[id];
//   await factory.ensureOutputDir();
//   event.reply("factoryEnsureOutputDirResult", id);
// });

// ipcMain.on("factoryGenerateRandomAttributes", (event, id, n) => {
//   const factory = factories[id];
//   const attributes = factory.generateRandomAttributes(n);
//   event.reply("factoryGenerateRandomAttributesResult", attributes);
// });

// ipcMain.on("factoryGenerateAttributes", (event, id) => {
//   const factory = factories[id];
//   const attributes = factory.generateAttributes();
//   event.reply("factoryGenerateAttributesResult", attributes);
// });

// ipcMain.on("factoryGenerateImages", async (event, id, attributes) => {
//   const factory = factories[id];
//   await factory.generateImages(attributes, (i) => {
//     event.reply("factoryGenerateImagesProgress", { id, i });
//   });
//   event.reply("factoryGenerateImagesResult", id);
// });

// ipcMain.on("factoryGenerateMetadata", async (event, id, cid, attributes) => {
//   const factory = factories[id];
//   await factory.generateMetadata(cid, attributes);
//   event.reply("factoryGenerateMetadataResult", id);
// });

// ipcMain.on("factoryDeployImages", async (event, id) => {
//   const factory = factories[id];
//   const cid = await factory.deployImages();
//   event.reply("factoryDeployImagesResult", cid);
// });

// ipcMain.on("factoryDeployMetadata", async (event, id) => {
//   const factory = factories[id];
//   const cid = await factory.deployMetadata();
//   event.reply("factoryDeployMetadataResult", cid);
// });

// ipcMain.on("factoryGetRandomImage", async (event, id, attributes) => {
//   const factory = factories[id];
//   const image = factory.getRandomImage(attributes);
//   event.reply("factoryGetRandomImageResult", image);
// });

// ipcMain.on("factoryGetImage", async (event, id, requestId, index) => {
//   const factory = factories[id];
//   const image = factory.getImage(index);
//   event.reply("factoryGetImageResult", { requestId, result: image });
// });

// ipcMain.on("getContract", async (event, name) => {
//   const content = await fs.promises.readFile(
//     path.join(__dirname, "contracts", `${name}.sol`),
//     {
//       encoding: "utf8",
//     }
//   );

//   const input = {
//     language: "Solidity",
//     sources: {
//       [name]: {
//         content,
//       },
//     },
//     settings: {
//       outputSelection: {
//         "*": {
//           "*": ["*"],
//         },
//       },
//     },
//   };

//   const output = JSON.parse(solc.compile(JSON.stringify(input)));
//   event.reply("getContractResult", output);
// });

// ipcMain.on("getOutputDir", (event, inputDir) => {
//   const outputDir = path.join(
//     path.dirname(inputDir),
//     `${path.basename(inputDir)}_build`
//   );
//   event.reply("getOutputDirResult", outputDir);
// });

// ipcMain.on("setPinataApiKey", (event, pinataApiKey) => {
//   setPinataApiKey(pinataApiKey);
//   event.reply("setPinataApiKeyResult", true);
// });

// ipcMain.on("getPinataApiKey", (event) => {
//   event.reply("getPinataApiKeyResult", getPinataApiKey());
// });

// ipcMain.on("setPinataSecretApiKey", (event, pinataSecretApiKey) => {
//   setPinataSecretApiKey(pinataSecretApiKey);
//   event.reply("setPinataSecretApiKeyResult", true);
// });

// ipcMain.on("getPinataSecretApiKey", (event) => {
//   event.reply("getPinataSecretApiKeyResult", getPinataSecretApiKey());
// });

// ipcMain.on("setInfuraId", (event, infuraId) => {
//   setInfuraId(infuraId);
//   event.reply("setInfuraIdResult", true);
// });

// ipcMain.on("getInfuraId", (event) => {
//   event.reply("getInfuraIdResult", getInfuraId());
// });
