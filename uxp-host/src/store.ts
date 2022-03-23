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

export function setInfuraId(infuraId: string) {
  store.set("infuraId", infuraId);
}

export function getInfuraId() {
  return store.has("infuraId") ? store.get("infuraId") : undefined;
}

export function setEtherscanApiKey(etherscanApiKey: string) {
  store.set("etherscanApiKey", etherscanApiKey);
}

export function getEtherscanApiKey() {
  return store.has("etherscanApiKey")
    ? store.get("etherscanApiKey")
    : undefined;
}
