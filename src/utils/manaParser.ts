import { ParsedManaSymbol } from '../types';

export function parseManaString(manaCost: string): ParsedManaSymbol[] {
  const symbols: ParsedManaSymbol[] = [];
  const regex = /\{([^}]+)\}/g;
  let match;

  while ((match = regex.exec(manaCost)) !== null) {
    const symbol = match[1];

    if (['W', 'U', 'B', 'R', 'G'].includes(symbol)) {
      symbols.push({ type: 'mana', value: symbol });
    } else if (symbol === 'C') {
      symbols.push({ type: 'mana', value: 'C' });
    } else if (symbol === 'T') {
      symbols.push({ type: 'tap', value: 'T' });
    } else if (symbol === 'X') {
      symbols.push({ type: 'generic', value: 'X' });
    } else if (/^\d+$/.test(symbol)) {
      symbols.push({ type: 'generic', value: symbol });
    } else if (symbol.includes('/')) {
      symbols.push({ type: 'hybrid', value: symbol });
    } else if (symbol.includes('P')) {
      symbols.push({ type: 'phyrexian', value: symbol });
    }
  }

  return symbols;
}

export function parseOracleText(text: string): (string | ParsedManaSymbol)[] {
  const result: (string | ParsedManaSymbol)[] = [];
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    const parsed = parseManaString(match[0]);
    if (parsed.length > 0) {
      result.push(parsed[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}
