export interface Secrets {
  pinataApiKey: string;
  pinataSecretApiKey: string;
  infuraId: string;
  etherscanApiKey: string;
}

export interface BaseConfiguration {
  n: number;
  layers: string[];
  width: number;
  height: number;
  generateBackground: boolean;
  defaultBackground: string;
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
  configuration: Configuration;
  collection: Collection;
  generated: boolean;
  metadataGenerated: boolean;
  imagesCID: string;
  metadataCID: string;
  network: string;
  contractAddress: string;
  abi: any[];
  compilerVersion: string;
}

export interface BundleNodeData {
  bundle: string;
}

export interface RenderNodeData {
  n: number;
  renderId: string;
}

export interface LayerNodeData {
  name: string;
  opacity: number;
  blending: string;
}

export interface CacheNodeData {
  name: string;
}

export interface BaseNode {
  id: string;
  type: string;
  data: any;
}

export interface Edge {
  id: string;
  type: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: any;
}

export interface RootNode extends BaseNode {
  type: "rootNode";
}

export interface LayerNode extends BaseNode {
  type: "layerNode";
  data: LayerNodeData;
}

export interface CacheNode extends BaseNode {
  type: "cacheNode";
  data: CacheNodeData;
}

export interface RenderNode extends BaseNode {
  type: "renderNode";
  data: RenderNodeData;
}

export interface BundleNode extends BaseNode {
  type: "bundleNode";
  data: BundleNodeData;
}

export type Node = RootNode | LayerNode | CacheNode | RenderNode | BundleNode;

export type NodesAndEdges = (Node | Edge)[];

export interface Instance {
  inputDir: string;
  outputDir: string;
  configuration: Partial<Configuration>;
  collection: Collection;
  bundles: Record<string, string[][]>;
  nodes: NodesAndEdges;
  imagesGenerated: boolean;
  metadataGenerated: boolean;
  imagesCid: string;
  metadataCid: string;
  network: string;
  contractAddress: string;
  abi: any[];
  compilerVersion: string;
}
