import { ManaColor } from '../types';

export type BorderColorKey = 'W' | 'U' | 'B' | 'R' | 'G' | 'C' | 'M';

export function determineBorderColor(colors: ManaColor[] | undefined): BorderColorKey {
  if (!colors || colors.length === 0) {
    return 'C';
  }

  if (colors.length === 1) {
    return colors[0] as BorderColorKey;
  }

  return 'M';
}

export function getManaColorCSS(color: string): string {
  const colorMap: Record<string, string> = {
    W: '#F8E7B9',
    U: '#0E68AB',
    B: '#150B00',
    R: '#D3202A',
    G: '#00733E',
    C: '#CBC2BF',
  };

  return colorMap[color] || '#888888';
}
