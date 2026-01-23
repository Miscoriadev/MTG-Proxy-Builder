export interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
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

export interface BorderImageVariants {
  base: string;
  legendary?: string;
  powerToughness?: string;
}

export type BorderImageValue = string | BorderImageVariants;

export interface BorderColorImages {
  W: BorderImageValue;
  U: BorderImageValue;
  B: BorderImageValue;
  R: BorderImageValue;
  G: BorderImageValue;
  C: BorderImageValue;
  M?: BorderImageValue;
  [key: string]: BorderImageValue | undefined;
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

export interface ArtPosition {
  centerX: number; // Percentage (0-100) of card width for art center
  centerY: number; // Percentage (0-100) of card height for art center
  scale: number;   // 1 = fit to card width
}

export interface BorderConfig {
  id: string;
  name: string;
  description?: string;
  images: BorderColorImages;
  textPositions: BorderTextPositions;
  manaSymbols: ManaSymbolPaths;
  art?: ArtPosition;
}

export interface BordersData {
  borders: BorderConfig[];
}
