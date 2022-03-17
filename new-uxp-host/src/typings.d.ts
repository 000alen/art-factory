export interface Secrets {
  pinataApiKey: string;
  pinataSecretApiKey: string;
  infuraId: string;
  etherscanApiKey: string;
}

export interface Configuration {
  n: number;
  layers: string[];
  width: number;
  height: number;
  generateBackground: boolean;
  defaultBackground: string;
  name: string;
  description: string;
  symbol: string;
}

export interface Layer {
  name: string;
  rarity: number;
  type: string;
  blending: string;
  opacity: number;
}

export type Trait = Layer & { value: string };

export type Attributes = Trait[][];

export interface Instance {
  inputDir: string;
  outputDir: string;
  configuration: Configuration;
  attributes: Attributes;
  generated: boolean;
  metadataGenerated: boolean;
  imagesCID: string;
  metadataCID: string;
  network: string;
  contractAddress: string;
  abi: any[];
  compilerVersion: string;
}

export interface RenderNodeData {
  n: number;
}

export interface LayerNodeData {
  layer: string;
  opacity: number;
  blending: string;
}

export interface BaseNode {
  id: string;
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

export type RootNode = BaseNode & { type: "rootNode" };

export type LayerNode = BaseNode & { type: "layerNode"; data: LayerNodeData };

export type RenderNode = BaseNode & {
  type: "renderNode";
  data: RenderNodeData;
};

export type Node = RootNode | LayerNode | RenderNode;

export type Element = Node | Edge;
