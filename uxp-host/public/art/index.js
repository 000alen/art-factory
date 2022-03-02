const {
  Factory,
  loadInstance,
  layersNames,
  name,
  sizeOf,
  compose,
} = require("./Factory");
const { pinFileToIPFS, verifyContract } = require("./utils");

module.exports = {
  Factory,
  loadInstance,
  layersNames,
  name,
  sizeOf,
  compose,
  pinFileToIPFS,
  verifyContract,
};
