export interface ImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G';

export interface ScryfallCard {
  id: string;
  name: string;
  type_line: string;
  oracle_text?: string;
  mana_cost?: string;
  colors?: ManaColor[];
  color_identity?: ManaColor[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  flavor_text?: string;
  image_uris?: ImageUris;
  artist?: string;
  set_name?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic';
}

export type ManaSymbol = ManaColor | 'C' | 'T' | 'X' | string;

export interface ParsedManaSymbol {
  type: 'mana' | 'generic' | 'tap' | 'hybrid' | 'phyrexian';
  value: string;
}
