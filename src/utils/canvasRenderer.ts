import {
  ScryfallCard,
  BorderConfig,
  TextPosition,
  SymbolsData,
} from "../types";
import { parseManaString, parseOracleText } from "./manaParser";
import { determineBorderColor } from "./colorUtils";
import { proxyImageUrl } from "./imageProxy";

const BASE_DPI = 72;
const CARD_WIDTH_INCHES = 2.5;
const CARD_HEIGHT_INCHES = 3.5;

// Fallback mana symbol colors (used when no SVG is available)
const MANA_COLORS: Record<
  string,
  { start: string; end: string; textColor: string }
> = {
  W: { start: "#FFFBD5", end: "#F8E7B9", textColor: "#000" },
  U: { start: "#AAE0FA", end: "#0E68AB", textColor: "#fff" },
  B: { start: "#CAC5C0", end: "#150B00", textColor: "#fff" },
  R: { start: "#F9AA8F", end: "#D3202A", textColor: "#000" },
  G: { start: "#9BD3AE", end: "#00733E", textColor: "#fff" },
  C: { start: "#CBC2BF", end: "#9A9A9A", textColor: "#000" },
};

// Cache for loaded symbol images
const symbolImageCache: Map<string, HTMLImageElement> = new Map();

// Cache for loaded fonts
const loadedFonts: Set<string> = new Set();

async function ensureFontLoaded(fontFamily: string): Promise<void> {
  // Extract the first font name from the font family string
  const primaryFont = fontFamily.split(",")[0].trim().replace(/["']/g, "");

  if (loadedFonts.has(primaryFont)) {
    return;
  }

  try {
    // Use the Font Loading API to load the font
    await document.fonts.load(`16px ${primaryFont}`);
    loadedFonts.add(primaryFont);
  } catch (e) {
    // Font may not be available, that's okay - browser will use fallback
    console.warn(`Font "${primaryFont}" could not be loaded:`, e);
  }
}

export interface RenderOptions {
  card: ScryfallCard;
  border: BorderConfig;
  backgroundUrl: string | null;
  dpi: number;
  symbolsData?: SymbolsData;
}

export function getCanvasDimensions(dpi: number): {
  width: number;
  height: number;
} {
  return {
    width: Math.round(CARD_WIDTH_INCHES * dpi),
    height: Math.round(CARD_HEIGHT_INCHES * dpi),
  };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function getSymbolUrl(
  symbol: string,
  borderManaSymbols: Record<string, string> | undefined,
  symbolsData: SymbolsData | undefined,
): string | null {
  // First check border's manaSymbols
  if (borderManaSymbols && borderManaSymbols[symbol]) {
    return borderManaSymbols[symbol];
  }

  // Fall back to symbols.json data (Scryfall SVGs)
  if (symbolsData && symbolsData[symbol]) {
    return proxyImageUrl(symbolsData[symbol].svg_uri);
  }

  return null;
}

async function loadSymbolImage(
  symbol: string,
  borderManaSymbols: Record<string, string> | undefined,
  symbolsData: SymbolsData | undefined,
): Promise<HTMLImageElement | null> {
  const cacheKey = symbol;

  if (symbolImageCache.has(cacheKey)) {
    return symbolImageCache.get(cacheKey)!;
  }

  const url = getSymbolUrl(symbol, borderManaSymbols, symbolsData);
  if (!url) {
    return null;
  }

  try {
    const img = await loadImage(url);
    symbolImageCache.set(cacheKey, img);
    return img;
  } catch (e) {
    console.warn(`Failed to load symbol image for ${symbol}:`, e);
    return null;
  }
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;

  let drawWidth: number;
  let drawHeight: number;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > canvasRatio) {
    drawHeight = height;
    drawWidth = img.width * (height / img.height);
    offsetX = (width - drawWidth) / 2;
  } else {
    drawWidth = width;
    drawHeight = img.height * (width / img.width);
    offsetY = (height - drawHeight) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function getScaledPosition(
  position: TextPosition,
  canvasWidth: number,
  canvasHeight: number,
  scaleFactor: number,
) {
  return {
    x: (position.x / 100) * canvasWidth,
    y: (position.y / 100) * canvasHeight,
    width: (position.width / 100) * canvasWidth,
    height: (position.height / 100) * canvasHeight,
    fontSize: position.fontSize * scaleFactor,
    fontFamily: position.fontFamily || "Georgia, serif",
    color: position.color || "#000000",
    align: position.align || "left",
  };
}

function drawManaSymbolFallback(
  ctx: CanvasRenderingContext2D,
  symbol: string,
  x: number,
  y: number,
  size: number,
) {
  const colors = MANA_COLORS[symbol] || MANA_COLORS.C;
  const radius = size / 2;

  // Draw circle with gradient
  const gradient = ctx.createRadialGradient(
    x + radius * 0.3,
    y + radius * 0.3,
    0,
    x + radius,
    y + radius,
    radius,
  );
  gradient.addColorStop(0, colors.start);
  gradient.addColorStop(1, colors.end);

  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw text
  ctx.fillStyle = colors.textColor;
  ctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, x + radius, y + radius);
}

async function drawManaSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: string,
  x: number,
  y: number,
  size: number,
  borderManaSymbols: Record<string, string> | undefined,
  symbolsData: SymbolsData | undefined,
): Promise<void> {
  const img = await loadSymbolImage(symbol, borderManaSymbols, symbolsData);

  if (img) {
    ctx.drawImage(img, x, y, size, size);
  } else {
    drawManaSymbolFallback(ctx, symbol, x, y, size);
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function drawTextWithManaSymbols(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  color: string,
  borderManaSymbols: Record<string, string> | undefined,
  symbolsData: SymbolsData | undefined,
): Promise<number> {
  const parsed = parseOracleText(text);
  const symbolSize = fontSize * 1.0; // TUNE: Mana symbol size relative to font
  const wrapLineHeight = fontSize * 1.1; // TUNE: Line spacing for word-wrap
  const newlineHeight = fontSize * 1.55; // TUNE: Line spacing for explicit newlines
  let currentX = x;
  let currentY = y + fontSize;
  let lineStartX = x;
  let inParentheses = false;

  const setFont = (italic: boolean) => {
    ctx.font = italic
      ? `italic ${fontSize}px ${fontFamily}`
      : `${fontSize}px ${fontFamily}`;
  };

  setFont(false);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  for (const part of parsed) {
    if (typeof part === "string") {
      // Handle text with potential line breaks
      const segments = part.split("\n");

      for (let i = 0; i < segments.length; i++) {
        if (i > 0) {
          // Explicit new line - use larger spacing
          currentY += newlineHeight;
          currentX = lineStartX;
        }

        const segment = segments[i];

        // Check for ability word pattern (text before em-dash or hyphen at start of segment)
        const abilityWordMatch = segment.match(/^([^—-]+)[—-]\s*/);
        let abilityWordEnd = 0;
        if (abilityWordMatch && currentX === lineStartX) {
          abilityWordEnd = abilityWordMatch[0].length;
        }

        // Process character by character to handle parentheses and ability words
        let wordBuffer = "";
        let wordIsItalic = false;

        const flushWord = () => {
          if (!wordBuffer) return;

          const wordWithSpace = wordBuffer + " ";
          const wordWidth = ctx.measureText(wordWithSpace).width;

          if (currentX + wordWidth > x + maxWidth && currentX > lineStartX) {
            currentY += wrapLineHeight;
            currentX = lineStartX;
          }

          setFont(wordIsItalic);
          ctx.fillText(wordWithSpace, currentX, currentY);
          currentX += wordWidth;
          wordBuffer = "";
        };

        for (let charIdx = 0; charIdx < segment.length; charIdx++) {
          const char = segment[charIdx];
          const isInAbilityWord = charIdx < abilityWordEnd;

          if (char === "(") {
            flushWord();
            inParentheses = true;
            wordIsItalic = true;
            wordBuffer = char;
          } else if (char === ")") {
            wordBuffer += char;
            flushWord();
            inParentheses = false;
            wordIsItalic = false;
          } else if (char === " ") {
            flushWord();
            wordIsItalic = inParentheses || isInAbilityWord;
          } else {
            if (
              wordBuffer === "" ||
              (inParentheses === wordIsItalic &&
                isInAbilityWord === wordIsItalic)
            ) {
              wordIsItalic = inParentheses || isInAbilityWord;
              wordBuffer += char;
            } else {
              // Style changed mid-word, flush and start new
              const newItalic: boolean = inParentheses || isInAbilityWord;
              if (newItalic !== wordIsItalic) {
                flushWord();
                wordIsItalic = newItalic;
              }
              wordBuffer += char;
            }
          }
        }

        flushWord();
      }
    } else {
      // Mana symbol
      if (currentX + symbolSize > x + maxWidth && currentX > lineStartX) {
        currentY += wrapLineHeight;
        currentX = lineStartX;
      }

      const displayValue = part.type === "tap" ? "T" : part.value;
      // Center the symbol vertically with the text
      // currentY is the baseline; place symbol so its center is at the x-height (roughly 0.5 * fontSize above baseline)
      const symbolY = currentY - fontSize * 0.32 - symbolSize / 2;
      await drawManaSymbol(
        ctx,
        displayValue,
        currentX,
        symbolY,
        symbolSize,
        borderManaSymbols,
        symbolsData,
      );
      currentX += symbolSize + 7; // Add small space after symbol
    }
  }

  // Return height from y to the bottom of the last line of text
  // currentY is the baseline, so we add a small amount for descenders
  return currentY - y + fontSize * 0.3;
}

// Measures the height of text with mana symbols WITHOUT drawing
// Used to calculate if text will fit in available space
// This mirrors the logic in drawTextWithManaSymbols for accurate measurement
function measureTextWithManaSymbols(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
): number {
  const parsed = parseOracleText(text);
  const symbolSize = fontSize * 1.0; // TUNE: Same as drawTextWithManaSymbols
  const wrapLineHeight = fontSize * 1.1; // TUNE: Same as drawTextWithManaSymbols
  const newlineHeight = fontSize * 1.55; // TUNE: Same as drawTextWithManaSymbols
  let currentX = 0;
  let currentY = fontSize;
  const lineStartX = 0;
  let inParentheses = false;

  const setFont = (italic: boolean) => {
    ctx.font = italic
      ? `italic ${fontSize}px ${fontFamily}`
      : `${fontSize}px ${fontFamily}`;
  };

  setFont(false);

  for (const part of parsed) {
    if (typeof part === "string") {
      const segments = part.split("\n");

      for (let i = 0; i < segments.length; i++) {
        if (i > 0) {
          currentY += newlineHeight;
          currentX = lineStartX;
        }

        const segment = segments[i];

        // Check for ability word pattern (same as drawing function)
        const abilityWordMatch = segment.match(/^([^—-]+)[—-]\s*/);
        let abilityWordEnd = 0;
        if (abilityWordMatch && currentX === lineStartX) {
          abilityWordEnd = abilityWordMatch[0].length;
        }

        // Process character by character (matching drawing function)
        let wordBuffer = "";
        let wordIsItalic = false;

        const flushWord = () => {
          if (!wordBuffer) return;

          const wordWithSpace = wordBuffer + " ";
          setFont(wordIsItalic);
          const wordWidth = ctx.measureText(wordWithSpace).width;

          if (currentX + wordWidth > maxWidth && currentX > lineStartX) {
            currentY += wrapLineHeight;
            currentX = lineStartX;
          }

          currentX += wordWidth;
          wordBuffer = "";
        };

        for (let charIdx = 0; charIdx < segment.length; charIdx++) {
          const char = segment[charIdx];
          const isInAbilityWord = charIdx < abilityWordEnd;

          if (char === "(") {
            flushWord();
            inParentheses = true;
            wordIsItalic = true;
            wordBuffer = char;
          } else if (char === ")") {
            wordBuffer += char;
            flushWord();
            inParentheses = false;
            wordIsItalic = false;
          } else if (char === " ") {
            flushWord();
            wordIsItalic = inParentheses || isInAbilityWord;
          } else {
            if (
              wordBuffer === "" ||
              (inParentheses === wordIsItalic && isInAbilityWord === wordIsItalic)
            ) {
              wordIsItalic = inParentheses || isInAbilityWord;
              wordBuffer += char;
            } else {
              const newItalic: boolean = inParentheses || isInAbilityWord;
              if (newItalic !== wordIsItalic) {
                flushWord();
                wordIsItalic = newItalic;
              }
              wordBuffer += char;
            }
          }
        }

        flushWord();
      }
    } else {
      // Mana symbol
      if (currentX + symbolSize > maxWidth && currentX > lineStartX) {
        currentY += wrapLineHeight;
        currentX = lineStartX;
      }
      currentX += symbolSize + 7;
    }
  }

  return currentY + fontSize * 0.3;
}

// Measures flavor text height (simple text wrapping, italic)
function measureFlavorText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
): number {
  ctx.font = `italic ${fontSize}px ${fontFamily}`;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.3;
  return lines.length * lineHeight;
}

async function drawManaCost(
  ctx: CanvasRenderingContext2D,
  cost: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  borderManaSymbols: Record<string, string> | undefined,
  symbolsData: SymbolsData | undefined,
): Promise<void> {
  const symbols = parseManaString(cost);
  const symbolSize = fontSize * 1.2;
  const spacing = 5;
  const totalWidth = symbols.length * (symbolSize + spacing) - spacing;

  // Right-align the mana cost
  let currentX = x + maxWidth - totalWidth;

  // Set up shadow for mana cost symbols
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = symbolSize * 0.05;
  ctx.shadowOffsetX = symbolSize * 0;
  ctx.shadowOffsetY = symbolSize * 0.1;

  for (const symbol of symbols) {
    const displayValue = symbol.type === "tap" ? "T" : symbol.value;
    await drawManaSymbol(
      ctx,
      displayValue,
      currentX,
      y,
      symbolSize,
      borderManaSymbols,
      symbolsData,
    );
    currentX += symbolSize + spacing;
  }

  ctx.restore();

  // Explicitly clear shadow in case restore didn't work as expected
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export async function renderCard(
  canvas: HTMLCanvasElement,
  options: RenderOptions,
): Promise<void> {
  const { card, border, backgroundUrl, dpi, symbolsData } = options;
  const { width, height } = getCanvasDimensions(dpi);
  const scaleFactor = dpi / BASE_DPI;
  const borderManaSymbols = border.manaSymbols;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Collect all font families used in this border config and ensure they're loaded
  const fontFamilies = new Set<string>();
  fontFamilies.add(border.textPositions.name.fontFamily || "Georgia, serif");
  fontFamilies.add(
    border.textPositions.manaCost.fontFamily || "Georgia, serif",
  );
  fontFamilies.add(
    border.textPositions.typeLine.fontFamily || "Georgia, serif",
  );
  fontFamilies.add(
    border.textPositions.oracleText.fontFamily || "Georgia, serif",
  );
  if (border.textPositions.flavorText) {
    fontFamilies.add(
      border.textPositions.flavorText.fontFamily || "Georgia, serif",
    );
  }
  if (border.textPositions.powerToughness) {
    fontFamilies.add(
      border.textPositions.powerToughness.fontFamily || "Georgia, serif",
    );
  }
  if (border.textPositions.loyalty) {
    fontFamilies.add(
      border.textPositions.loyalty.fontFamily || "Georgia, serif",
    );
  }

  // Load all fonts in parallel
  await Promise.all([...fontFamilies].map(ensureFontLoaded));

  // Clear canvas and reset shadow state
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, width, height);

  // Load and draw background
  if (backgroundUrl) {
    try {
      const bgImage = await loadImage(proxyImageUrl(backgroundUrl));
      drawImageCover(ctx, bgImage, width, height);
    } catch (e) {
      console.warn("Failed to load background image:", e);
    }
  }

  // Load and draw border
  const borderColor = determineBorderColor(card.colors);
  const borderImageUrl = border.images[borderColor] || border.images.C;

  try {
    const borderImage = await loadImage(proxyImageUrl(borderImageUrl));
    ctx.drawImage(borderImage, 0, 0, width, height);
  } catch (e) {
    console.warn("Failed to load border image:", e);
  }

  // Draw legendary overlay if card has legendary frame effect
  if (card.frame_effects?.includes("legendary")) {
    const legendaryKey = `${borderColor}-Legendary`;
    const legendaryUrl = border.images[legendaryKey];

    if (legendaryUrl) {
      try {
        const legendaryImage = await loadImage(proxyImageUrl(legendaryUrl));
        ctx.drawImage(legendaryImage, 0, 0, width, height);
      } catch (e) {
        console.warn("Failed to load legendary overlay:", e);
      }
    }
  }

  // Draw card name
  const namePos = getScaledPosition(
    border.textPositions.name,
    width,
    height,
    scaleFactor,
  );
  // Reset shadow state before drawing text
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = `${namePos.fontSize}px ${namePos.fontFamily}`;
  ctx.fillStyle = namePos.color;
  ctx.textAlign = namePos.align as CanvasTextAlign;
  ctx.textBaseline = "top";
  ctx.fillText(card.name, namePos.x, namePos.y);

  // Draw mana cost
  if (card.mana_cost) {
    const manaPos = getScaledPosition(
      border.textPositions.manaCost,
      width,
      height,
      scaleFactor,
    );
    await drawManaCost(
      ctx,
      card.mana_cost,
      manaPos.x,
      manaPos.y,
      manaPos.width,
      manaPos.fontSize,
      borderManaSymbols,
      symbolsData,
    );
  }

  // Draw type line
  const typePos = getScaledPosition(
    border.textPositions.typeLine,
    width,
    height,
    scaleFactor,
  );
  // Reset shadow state before drawing text
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = `${typePos.fontSize}px ${typePos.fontFamily}`;
  ctx.fillStyle = typePos.color;
  ctx.textAlign = typePos.align as CanvasTextAlign;
  ctx.textBaseline = "top";
  ctx.fillText(card.type_line, typePos.x, typePos.y);

  // Draw oracle text and flavor text with dynamic font sizing
  let oracleEndY = 0;
  const hasOracleText = !!card.oracle_text;
  const hasFlavorText = !!card.flavor_text && !!border.textPositions.flavorText;

  if (hasOracleText || hasFlavorText) {
    const oraclePos = getScaledPosition(
      border.textPositions.oracleText,
      width,
      height,
      scaleFactor,
    );

    const flavorPos = hasFlavorText
      ? getScaledPosition(
          border.textPositions.flavorText!,
          width,
          height,
          scaleFactor,
        )
      : null;

    // Calculate available height for text (use oraclePos.height as the constraint)
    const availableHeight = oraclePos.height;
    const baseFontSize = oraclePos.fontSize;
    const minFontSize = baseFontSize * 0.5; // TUNE: Minimum font size (50% of base)
    const fontStep = 1; // TUNE: Font size reduction step

    // Function to calculate total height at a given font size
    const calculateTotalHeight = (fontSize: number): number => {
      let totalHeight = 0;

      if (hasOracleText) {
        totalHeight += measureTextWithManaSymbols(
          ctx,
          card.oracle_text!,
          oraclePos.width,
          fontSize,
          oraclePos.fontFamily,
        );
      }

      if (hasFlavorText && flavorPos) {
        const gapSize = fontSize * 1.5; // Gap between oracle and flavor
        if (hasOracleText) {
          totalHeight += gapSize;
        }
        totalHeight += measureFlavorText(
          ctx,
          card.flavor_text!,
          flavorPos.width,
          fontSize,
          flavorPos.fontFamily,
        );
      }

      return totalHeight;
    };

    // Find the optimal font size that fits
    let fontSize = baseFontSize;
    while (fontSize > minFontSize) {
      const totalHeight = calculateTotalHeight(fontSize);
      if (totalHeight <= availableHeight) {
        break;
      }
      fontSize -= fontStep;
    }

    // Draw oracle text with calculated font size
    if (hasOracleText) {
      const oracleHeight = await drawTextWithManaSymbols(
        ctx,
        card.oracle_text!,
        oraclePos.x,
        oraclePos.y,
        oraclePos.width,
        fontSize,
        oraclePos.fontFamily,
        oraclePos.color,
        borderManaSymbols,
        symbolsData,
      );
      oracleEndY = oraclePos.y + oracleHeight;
    }

    // Draw flavor text below oracle text with divider
    if (hasFlavorText && flavorPos) {
      const gapSize = fontSize * 1.5; // Total gap between oracle and flavor text

      // Calculate Y position based on oracle text end (or use default if no oracle text)
      const flavorY = hasOracleText ? oracleEndY + gapSize : flavorPos.y;

      // Draw divider line centered between oracle and flavor text
      if (hasOracleText) {
        const dividerY = oracleEndY + gapSize / 2;
        ctx.beginPath();
        ctx.moveTo(flavorPos.x, dividerY);
        ctx.lineTo(flavorPos.x + flavorPos.width, dividerY);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1 * scaleFactor;
        ctx.stroke();
      }

      // Draw flavor text with calculated font size
      ctx.font = `italic ${fontSize}px ${flavorPos.fontFamily}`;
      ctx.fillStyle = flavorPos.color;
      ctx.textAlign = flavorPos.align as CanvasTextAlign;
      ctx.textBaseline = "top";

      const lines = wrapText(ctx, card.flavor_text!, flavorPos.width);
      const lineHeight = fontSize * 1.3;

      lines.forEach((line, index) => {
        ctx.fillText(line, flavorPos.x, flavorY + index * lineHeight);
      });
    }
  }

  // Draw power/toughness
  if (card.power && card.toughness && border.textPositions.powerToughness) {
    const ptPos = getScaledPosition(
      border.textPositions.powerToughness,
      width,
      height,
      scaleFactor,
    );
    ctx.font = `bold ${ptPos.fontSize}px ${ptPos.fontFamily}`;
    ctx.fillStyle = ptPos.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      `${card.power}/${card.toughness}`,
      ptPos.x + ptPos.width / 2,
      ptPos.y,
    );
  }

  // Draw loyalty
  if (card.loyalty && border.textPositions.loyalty) {
    const loyaltyPos = getScaledPosition(
      border.textPositions.loyalty,
      width,
      height,
      scaleFactor,
    );
    ctx.font = `bold ${loyaltyPos.fontSize}px ${loyaltyPos.fontFamily}`;
    ctx.fillStyle = loyaltyPos.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      card.loyalty,
      loyaltyPos.x + loyaltyPos.width / 2,
      loyaltyPos.y,
    );
  }
}

export function downloadPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
