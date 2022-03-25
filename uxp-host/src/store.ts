import Store from "electron-store";

const store = new Store();

export function setPinataApiKey(pinataApiKey: string) {
  store.set("pinataApiKey", pinataApiKey);
}

export function getPinataApiKey() {
  return store.has("pinataApiKey") ? store.get("pinataApiKey") : undefined;
}

export function setPinataSecretApiKey(pinataSecretApiKey: string) {
  store.set("pinataSecretApiKey", pinataSecretApiKey);
}

export function getPinataSecretApiKey() {
  return store.has("pinataSecretApiKey")
    ? store.get("pinataSecretApiKey")
    : undefined;
}

export function setInfuraProjectId(infuraProjectId: string) {
  store.set("infuraProjectId", infuraProjectId);
}

export function getInfuraProjectId() {
  return store.has("infuraProjectId")
    ? store.get("infuraProjectId")
    : undefined;
}

export function setEtherscanApiKey(etherscanApiKey: string) {
  store.set("etherscanApiKey", etherscanApiKey);
}

export function getEtherscanApiKey() {
  return store.has("etherscanApiKey")
    ? store.get("etherscanApiKey")
    : undefined;
}
