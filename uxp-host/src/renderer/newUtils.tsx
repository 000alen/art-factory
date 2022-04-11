import { Configuration, ContractType, Instance } from "./newTypings";
import { spacedName } from "./utils";

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
  configuration: createConfiguration(),
  nodes: [],
  generations: [],
});
