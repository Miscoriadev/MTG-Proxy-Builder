export interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface BorderTextPositions {
  name: TextPosition;
  typeLine: TextPosition;
  oracleText: TextPosition;
  powerToughness?: TextPosition;
  loyalty?: TextPosition;
  flavorText?: TextPosition;
  manaCost: TextPosition;
}

export interface BorderColorImages {
  W: string;
  U: string;
  B: string;
  R: string;
  G: string;
  C: string;
  M?: string;
}

export interface ManaSymbolPaths {
  W: string;
  U: string;
  B: string;
  R: string;
  G: string;
  C: string;
  T: string;
  [key: string]: string;
}

export interface BorderConfig {
  id: string;
  name: string;
  description?: string;
  images: BorderColorImages;
  textPositions: BorderTextPositions;
  manaSymbols: ManaSymbolPaths;
  cardDimensions: {
    width: number;
    height: number;
  };
}

export interface BordersData {
  borders: BorderConfig[];
}
