enum ContractType {
  ERC721,
  ERC721_REVEAL_PAUSE,
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Configuration {
  name: string;
  description: string;
  symbol: string;
  contractType: ContractType;
  width: number;
  height: number;
  generateBackground: boolean;
  defaultBackground: Color;
}
