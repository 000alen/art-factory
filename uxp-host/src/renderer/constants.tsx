import { BundleNode } from "./components/BundleNode";
import { CustomEdge } from "./components/CustomEdge";
import { LayerNode } from "./components/LayerNode";
import { RenderNode } from "./components/RenderNode";
import { RootNode } from "./components/RootNode";

export const Networks: Record<string, any> = {
  mainnet: {
    name: "Mainnet",
    id: 1,
  },
  ropsten: {
    name: "Ropsten",
    id: 3,
  },
  rinkeby: {
    name: "Rinkeby",
    id: 4,
  },
};

export const ContractTypes: Record<string, any> = {
  721: {
    name: "ERC721",
  },
  1155: {
    name: "ERC1155",
  },
};

export const MAX_SIZE = 500;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_BLENDING = "normal";
export const DEFAULT_N = 1;

export const NODE_TYPES = {
  rootNode: RootNode,
  layerNode: LayerNode,
  renderNode: RenderNode,
  bundleNode: BundleNode,
};

export const EDGE_TYPES = {
  customEdge: CustomEdge,
};

export const NAMESPACE = "84002a51-4399-4405-bf15-05decc67081e";

export const DEFAULT_NODES = [
  {
    id: "root",
    type: "rootNode",
    position: { x: 0, y: 0 },
    data: {},
  },
];
