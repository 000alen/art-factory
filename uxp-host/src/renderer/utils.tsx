import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { v4 as uuid, v5 as uuidv5 } from "uuid";
import { NAMESPACE, Networks } from "./constants";
import { Configuration, ContractType, Instance } from "./typings";

const spacedNameConfiguration = {
  dictionaries: [colors, adjectives, animals],
  separator: " ",
  length: 2,
};

const dashedNameConfiguration = {
  dictionaries: [colors, adjectives, animals],
  separator: "-",
  length: 2,
};

// let _id = 0;

export const spacedName = () => uniqueNamesGenerator(spacedNameConfiguration);

export const dashedName = () => uniqueNamesGenerator(dashedNameConfiguration);

// export const getId = () => `${_id++}`;
export const getId = () => uuid();

export const capitalize = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

export const chopAddress = (address: string) =>
  address.substring(0, 5) + "(...)" + address.substring(address.length - 3);

export const hash = (object: any): string =>
  uuidv5(JSON.stringify(object), NAMESPACE);

export const difference = <T,>(a: Set<T>, b: Set<T>): Set<T> =>
  new Set([...a].filter((x) => !b.has(x)));

export const arrayDifference = <T,>(a: T[], b: T[]): T[] =>
  a.filter((x) => !b.includes(x));

export const chooseN = <T,>(a: T[], n: number): T[] =>
  [...a].sort(() => 0.5 - Math.random()).slice(0, n);

export const createConfiguration = (): Configuration => ({
  name: spacedName(),
  description: "Lorem ipsum",
  symbol: "LOREM",
  contractType: ContractType.ERC721,
  width: 500,
  height: 500,
  generateBackground: true,
  defaultBackground: {
    r: 255,
    g: 255,
    b: 255,
    a: 1,
  },
  cost: 0,
  maxMintAmount: 0,
  layers: [] as string[],
});

export const createInstance = (): Instance => ({
  frozen: false,
  configuration: createConfiguration(),
  templates: [],
  generations: [],
});

export function resolveEtherscanUrl(
  network: { name: string; id: number },
  transactionHash: string
) {
  return network === Networks.mainnet
    ? `https://etherscan.io/tx/${transactionHash}`
    : network === Networks.ropsten
    ? `https://ropsten.etherscan.io/tx/${transactionHash}`
    : network === Networks.rinkeby
    ? `https://rinkeby.etherscan.io/tx/${transactionHash}`
    : null;
}
