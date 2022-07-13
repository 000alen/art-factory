import { Network } from "./typings";

export const ChainId = {
  [Network.MAIN]: 1,
  [Network.RINKEBY]: 4,
};

export const NAMESPACE = "84002a51-4399-4405-bf15-05decc67081e";
export const RARITY_DELIMITER = "#";
export const DEFAULT_BLENDING = "normal";
export const DEFAULT_OPACITY = 1;
export const DEFAULT_BACKGROUND = {
  r: 255,
  g: 255,
  b: 255,
  a: 1,
};
export const BUILD_DIR_NAME = ".build";

export const RINKEBY_WETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

export const MAIN_WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export const PARALLEL_LIMIT = 256;

export const MINT_N = 128;

export const DEFAULT_SEED =
  "Y aquí estoy, ultra solo, pensando en que me cambiaste por otro, pensando en cómo lo perdimos todo.";
