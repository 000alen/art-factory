import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { v4 as uuid, v5 as uuidv5 } from "uuid";
import { NAMESPACE } from "./constants";

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

let _id = 0;

export const spacedName = () => uniqueNamesGenerator(spacedNameConfiguration);

export const dashedName = () => uniqueNamesGenerator(dashedNameConfiguration);

export const getId = () => `${_id++}`;

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
