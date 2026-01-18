export interface BackgroundImage {
  url: string;
  label?: string;
  source?: 'scryfall' | 'custom';
}

export interface BackgroundsData {
  [cardId: string]: BackgroundImage[];
}
