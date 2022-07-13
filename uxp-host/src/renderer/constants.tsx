import { Network } from "./typings";

export const ChainId = {
  [Network.MAIN]: 1,
  [Network.RINKEBY]: 4,
};

export const METADATA_FIELDS = ["external_url", "animation_url", "youtube_url"];

export const MAX_SIZE = 500;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_BLENDING = "normal";
export const DEFAULT_N = 1;
export const DEFAULT_SALE_TYPE = "fixed";
export const DEFAULT_PRICE = 0.01;
export const DEFAULT_SALE_TIME = 0;

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
export const DEFAULT_MAX_MINT_AMOUNT = 20;
export const BUILD_DIR_NAME = ".build";

export const MINT_N = 128;

export const DEFAULT_SEED =
  "Y aquí estoy, ultra solo, pensando en que me cambiaste por otro, pensando en cómo lo perdimos todo.";
