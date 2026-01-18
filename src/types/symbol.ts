export interface CardSymbol {
  object: string;
  symbol: string;
  svg_uri: string;
  loose_variant: string | null;
  english: string;
  transposable: boolean;
  represents_mana: boolean;
  appears_in_mana_costs: boolean;
  mana_value: number | null;
  hybrid: boolean;
  phyrexian: boolean;
  cmc: number | null;
  funny: boolean;
  colors: string[];
  gatherer_alternates: string[] | null;
}

export type SymbolsData = Record<string, CardSymbol>;
