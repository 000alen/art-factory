export interface Secrets {
  pinataApiKey: string;
  pinataSecretApiKey: string;
  infuraProjectId: string;
  etherscanApiKey: string;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BaseConfiguration {
  n: number;
  layers: string[];
  width: number;
  height: number;
  generateBackground: boolean;
  defaultBackground: Color;
  name: string;
  description: string;
  symbol: string;
  contractType: string;
}

export interface Configuration721 extends BaseConfiguration {
  cost: number;
  maxMintAmount: number;
}

export interface Configuration1155 extends BaseConfiguration {}

export type Configuration = Configuration721 | Configuration1155;

export interface Layer {
  basePath: string;
  name: string;
  blending: string;
  opacity: number;
}

export interface Trait extends Layer {
  id?: string;
  fileName: string;
  value: string;
  rarity: number;
  type: string;
}

export interface CollectionItem {
  name: string;
  traits: Trait[];
}

export type Collection = CollectionItem[];

export interface Instance {
  inputDir: string;
  outputDir: string;
  configuration: Partial<Configuration>;

  collection: Collection;
  bundles: Record<string, string[][]>;

  imagesGenerated: boolean;
  metadataGenerated: boolean;

  imagesCid: string;
  metadataCid: string;
  notRevealedImageCid: string;
  notRevealedMetadataCid: string;

  network: string;
  contractAddress: string;
  abi: any[];
  compilerVersion: string;
}
