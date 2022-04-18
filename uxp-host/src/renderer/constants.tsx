export const METADATA_FIELDS = ["external_url", "animation_url", "youtube_url"];

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

export const MAX_SIZE = 500;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_BLENDING = "normal";
export const DEFAULT_N = 1;

export const NAMESPACE = "84002a51-4399-4405-bf15-05decc67081e";

export const DEFAULT_NODES = [
  {
    id: "root",
    type: "rootNode",
    position: { x: 200, y: 200 },
    data: {},
  },
];

export const PAGE_N = 50;
export const RARITY_DELIMITER = "#";
export const DEFAULT_BACKGROUND = {
  r: 255,
  g: 255,
  b: 255,
  a: 1,
};
export const DEFAULT_COST = 0.05;
export const DEFAULT_MAX_MINT_AMOUNT = 20;
export const BUILD_DIR_NAME = ".build";
