const Store = require("electron-store");

const store = new Store();

function setPinataApiKey(pinataApiKey) {
  store.set("pinataApiKey", pinataApiKey);
}

function getPinataApiKey() {
  return store.has("pinataApiKey") ? store.get("pinataApiKey") : undefined;
}

function setPinataSecretApiKey(pinataSecretApiKey) {
  store.set("pinataSecretApiKey", pinataSecretApiKey);
}

function getPinataSecretApiKey() {
  return store.has("pinataSecretApiKey")
    ? store.get("pinataSecretApiKey")
    : undefined;
}

function setInfuraId(infuraId) {
  store.set("infuraId", infuraId);
}

function getInfuraId() {
  return store.has("infuraId") ? store.get("infuraId") : undefined;
}

module.exports = {
  setPinataApiKey,
  getPinataApiKey,
  setPinataSecretApiKey,
  getPinataSecretApiKey,
  setInfuraId,
  getInfuraId,
};
