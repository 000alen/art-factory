import { Edge as FlowEdge, Node as FlowNode } from "react-flow-renderer";

export enum ContractType {
  ERC721 = "721",
  ERC721_REVEAL_PAUSE = "721_reveal_pause",
  ERC721_CLIENT_MINT = "721_client_mint",
}

export enum PolygonNetwork {
  MATIC = "matic",
  MUMBAI = "mumbai"
}

export enum Network {
  MAIN = "main",
  RINKEBY = "rinkeby",
}

export enum SaleType {
  FIXED = "fixed",
  DUTCH = "dutch",
  ENGLISH = "english",
}

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

export interface Configuration {
  name: string;
  description: string;
  symbol: string;
  contractType: ContractType;
  width: number;
  height: number;
  generateBackground: boolean;
  defaultBackground: Color;
  layers: string[];
}

export interface Template {
  id: string;
  name: string;
  traits: Trait[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  renderIds: Record<string, string>;
  ns: Record<string, number>;
  ignored: string[];
  salesTypes: Record<string, SaleType>;
  startingPrices: Record<string, number>;
  endingPrices: Record<string, number>;
  salesTimes: Record<string, number>;
}

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
  saleType: SaleType;
  startingPrice: number;
  endingPrice: number;
  saleTime: number;
}

export interface BundlesInfoItem {
  name: string;
  ids: string[];
  saleType: SaleType;
  startingPrice: number;
  endingPrice: number;
  saleTime: number;
}

export type BundlesInfo = BundlesInfoItem[];

export interface BundleItem {
  name: string;
  ids: string[][];
  saleType: SaleType;
  startingPrice: number;
  endingPrice: number;
  saleTime: number;
}

export type Collection = CollectionItem[];

export type Bundles = BundleItem[];

export interface MetadataItem {
  key: string;
  value: string;
}

export interface Drop {
  name: string;
  ids: string[];
  bundles: string[];
}

export interface Generation {
  id: string;
  name: string;
  collection: Collection;
  bundles: Bundles;
  drops: Drop[];
}

export interface Deployment {
  imagesCid: string;
  metadataCid: string;
  notRevealedImageCid?: string;
  notRevealedMetadataCid?: string;
  network: Network;
  contractAddress: string;
  abi: any[];
  compilerVersion: string;
  generation: Generation;
  dropNumber: number;
}

export interface SourceItem {
  photoshopTraitLayer: string;
  name: string;
  value: string;
}

export interface Source {
  name: string;
  items: SourceItem[];
}

export interface Instance {
  frozen: boolean;
  configuration: Configuration;
  templates: Template[];
  generations: Generation[];
  deployment?: Deployment;
  sources: Source[];
}
