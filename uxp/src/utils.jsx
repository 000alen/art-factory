import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

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

export const spacedName = () => uniqueNamesGenerator(spacedNameConfiguration);

export const dashedName = () => uniqueNamesGenerator(dashedNameConfiguration);
