import React from 'react';
import { ScryfallCard, BorderTextPositions, TextPosition, ParsedManaSymbol } from '../../../types';
import { parseOracleText, parseManaString } from '../../../utils/manaParser';
import styles from '../CardPreview.module.css';

interface TextOverlayLayerProps {
  card: ScryfallCard;
  positions: BorderTextPositions;
}

function positionToStyle(position: TextPosition): React.CSSProperties {
  return {
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: `${position.width}%`,
    maxHeight: `${position.height}%`,
    fontSize: `${position.fontSize}px`,
    fontFamily: position.fontFamily || 'inherit',
    color: position.color || '#000',
    textAlign: position.align || 'left',
  };
}

function ManaSymbolInline({ symbol }: { symbol: ParsedManaSymbol }) {
  const getSymbolClass = () => {
    if (symbol.type === 'mana') {
      return `${styles.inlineSymbol} ${styles.manaSymbol} ${styles[symbol.value] || ''}`;
    }
    if (symbol.type === 'tap') {
      return `${styles.inlineSymbol} ${styles.manaSymbol}`;
    }
    return `${styles.inlineSymbol} ${styles.manaSymbol} ${styles.generic}`;
  };

  const displayValue = symbol.type === 'tap' ? 'T' : symbol.value;

  return <span className={getSymbolClass()}>{displayValue}</span>;
}

function OracleTextRenderer({ text }: { text: string }) {
  const parsed = parseOracleText(text);

  return (
    <>
      {parsed.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }
        return <ManaSymbolInline key={index} symbol={part} />;
      })}
    </>
  );
}

function ManaCostDisplay({ cost }: { cost: string }) {
  const symbols = parseManaString(cost);

  return (
    <>
      {symbols.map((symbol, index) => {
        const className = symbol.type === 'mana'
          ? `${styles.manaSymbol} ${styles[symbol.value] || ''}`
          : `${styles.manaSymbol} ${styles.generic}`;

        return (
          <span key={index} className={className}>
            {symbol.value}
          </span>
        );
      })}
    </>
  );
}

export function TextOverlayLayer({ card, positions }: TextOverlayLayerProps) {
  return (
    <div className={styles.textLayer}>
      {/* Card Name */}
      <div
        className={styles.textElement}
        style={positionToStyle(positions.name)}
      >
        {card.name}
      </div>

      {/* Mana Cost */}
      {card.mana_cost && (
        <div
          className={styles.manaCostContainer}
          style={positionToStyle(positions.manaCost)}
        >
          <ManaCostDisplay cost={card.mana_cost} />
        </div>
      )}

      {/* Type Line */}
      <div
        className={styles.textElement}
        style={positionToStyle(positions.typeLine)}
      >
        {card.type_line}
      </div>

      {/* Oracle Text */}
      {card.oracle_text && (
        <div
          className={styles.oracleText}
          style={positionToStyle(positions.oracleText)}
        >
          <OracleTextRenderer text={card.oracle_text} />
        </div>
      )}

      {/* Flavor Text */}
      {card.flavor_text && positions.flavorText && (
        <div
          className={styles.flavorText}
          style={positionToStyle(positions.flavorText)}
        >
          {card.flavor_text}
        </div>
      )}

      {/* Power/Toughness (Creatures) */}
      {card.power && card.toughness && positions.powerToughness && (
        <div
          className={styles.powerToughness}
          style={positionToStyle(positions.powerToughness)}
        >
          {card.power}/{card.toughness}
        </div>
      )}

      {/* Loyalty (Planeswalkers) */}
      {card.loyalty && positions.loyalty && (
        <div
          className={styles.textElement}
          style={positionToStyle(positions.loyalty)}
        >
          {card.loyalty}
        </div>
      )}
    </div>
  );
}
