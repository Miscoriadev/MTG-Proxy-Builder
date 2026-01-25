import {
  ScryfallCard,
  BorderConfig,
  TextPosition,
  SymbolsData,
  ArtPosition,
  BorderImageValue,
} from "../types";
import { parseManaString, parseOracleText } from "./manaParser";
import { determineBorderColor } from "./colorUtils";
import { proxyImageUrl } from "./imageProxy";

const BASE_DPI = 72;
const CARD_WIDTH_INCHES = 2.5;
const CARD_HEIGHT_INCHES = 3.5;

// Margin constants for print bleed
const MARGIN_MM = 5;
const MM_PER_INCH = 25.4;
const MARGIN_INCHES = MARGIN_MM / MM_PER_INCH; // ~0.197"

// Full canvas includes margin on all sides (border images include this margin)
const FULL_CANVAS_WIDTH_INCHES = CARD_WIDTH_INCHES + 2 * MARGIN_INCHES;
const FULL_CANVAS_HEIGHT_INCHES = CARD_HEIGHT_INCHES + 2 * MARGIN_INCHES;

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

// Cache for general images (backgrounds, borders, overlays)
const imageCache: Map<string, HTMLImageElement> = new Map();

// Cache for loaded fonts
const loadedFonts: Set<string> = new Set();

// Helper to get image URL from BorderImageValue (supports both string and object formats)
function getBorderImageUrl(
  value: BorderImageValue | undefined,
  variant: "base" | "legendary" | "powerToughness" = "base",
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value[variant] ?? value.base;
}

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

export interface BackgroundTransform {
  scale: number;
  offsetX: number; // Percentage of canvas width (0-100)
  offsetY: number; // Percentage of canvas height (0-100)
}

export interface RenderOptions {
  card: ScryfallCard;
  border: BorderConfig;
  backgroundUrl: string | null;
  backgroundTransform?: BackgroundTransform;
  dpi: number;
  debug?: boolean;
  symbolsData?: SymbolsData;
}

export interface CanvasDimensions {
  fullWidth: number; // Full canvas including margin
  fullHeight: number;
  cardWidth: number; // Card-only area (no margin)
  cardHeight: number;
  marginPixels: number; // Margin in pixels at this DPI
}

export function getCanvasDimensions(dpi: number): CanvasDimensions {
  const marginPixels = Math.round((MARGIN_MM / MM_PER_INCH) * dpi);
  return {
    fullWidth: Math.round(FULL_CANVAS_WIDTH_INCHES * dpi),
    fullHeight: Math.round(FULL_CANVAS_HEIGHT_INCHES * dpi),
    cardWidth: Math.round(CARD_WIDTH_INCHES * dpi),
    cardHeight: Math.round(CARD_HEIGHT_INCHES * dpi),
    marginPixels,
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

// Load image with caching - returns cached image if available
async function loadImageCached(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  const img = await loadImage(url);
  imageCache.set(url, img);
  return img;
}

function getSymbolUrl(
  symbol: string,
  borderManaSymbols: Record<string, string> | undefined,
  symbolsData: SymbolsData | undefined,
): string | null {
  // First check border's manaSymbols
  if (borderManaSymbols && borderManaSymbols[symbol]) {
    return proxyImageUrl(borderManaSymbols[symbol]);
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
  artPosition?: ArtPosition,
  transform?: BackgroundTransform,
) {
  // Default art position: centered, scale 1 = fit to width
  const centerX = artPosition?.centerX ?? 50;
  const centerY = artPosition?.centerY ?? 50;
  const baseScale = artPosition?.scale ?? 1;

  // User transform adjustments (offsets are percentages)
  const userScale = transform?.scale ?? 1;
  const userOffsetX = ((transform?.offsetX ?? 0) / 100) * width;
  const userOffsetY = ((transform?.offsetY ?? 0) / 100) * height;

  // Scale 1 = image width fits card width
  const baseDrawWidth = width * baseScale * userScale;
  const baseDrawHeight = (img.height / img.width) * baseDrawWidth;

  // Position image so its center aligns with the specified center point
  const targetCenterX = (centerX / 100) * width;
  const targetCenterY = (centerY / 100) * height;

  const finalX = targetCenterX - baseDrawWidth / 2 + userOffsetX;
  const finalY = targetCenterY - baseDrawHeight / 2 + userOffsetY;

  ctx.drawImage(img, finalX, finalY, baseDrawWidth, baseDrawHeight);
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
              (inParentheses === wordIsItalic &&
                isInAbilityWord === wordIsItalic)
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

// Finds the optimal font size for single-line text to fit within maxWidth
function fitTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseFontSize: number,
  fontFamily: string,
  minFontSize: number = baseFontSize * 0.5,
): number {
  let fontSize = baseFontSize;

  while (fontSize > minFontSize) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(text).width;

    if (textWidth <= maxWidth) {
      return fontSize;
    }

    fontSize -= 0.5;
  }

  return minFontSize;
}

async function drawManaCost(
  ctx: CanvasRenderingContext2D,
  cost: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  scaleFactor: number,
  align: "left" | "center" | "right",
  verticalAlign: "top" | "center" | "bottom",
  borderManaSymbols: Record<string, string> | undefined,
  symbolsData: SymbolsData | undefined,
): Promise<void> {
  const symbols = parseManaString(cost);
  const symbolSize = fontSize * 1.2;
  const spacing = 1.7 * scaleFactor;
  const totalWidth = symbols.length * (symbolSize + spacing) - spacing;

  // Calculate X position based on horizontal alignment
  let currentX: number;
  if (align === "left") {
    currentX = x;
  } else if (align === "center") {
    currentX = x + (width - totalWidth) / 2;
  } else {
    // right alignment (default behavior)
    currentX = x + width - totalWidth;
  }

  // Calculate Y position based on vertical alignment
  let symbolY: number;
  if (verticalAlign === "top") {
    symbolY = y;
  } else if (verticalAlign === "center") {
    symbolY = y + (height - symbolSize) / 2;
  } else {
    // bottom alignment
    symbolY = y + height - symbolSize;
  }

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
      symbolY,
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

// Debug colors for text position bounding boxes
const DEBUG_COLORS: Record<string, string> = {
  name: "rgba(255, 0, 0, 0.4)", // Red
  manaCost: "rgba(0, 255, 0, 0.4)", // Green
  typeLine: "rgba(0, 0, 255, 0.4)", // Blue
  oracleText: "rgba(255, 255, 0, 0.4)", // Yellow
  flavorText: "rgba(255, 0, 255, 0.4)", // Magenta
  powerToughness: "rgba(0, 255, 255, 0.4)", // Cyan
  loyalty: "rgba(255, 128, 0, 0.4)", // Orange
  art: "rgba(128, 0, 255, 0.4)", // Purple
  artist: "rgba(0, 128, 128, 0.4)", // Teal
  copyright: "rgba(128, 128, 0, 0.4)", // Olive
};

/**
 * Draws debug rectangles for all text position bounding boxes.
 * Each text element gets a different colored rectangle to help with positioning.
 */
function drawDebugBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  border: BorderConfig,
  canvasWidth: number,
  canvasHeight: number,
  scaleFactor: number,
): void {
  ctx.save();
  ctx.lineWidth = (2 / 3) * scaleFactor;

  // Draw art position
  if (border.art) {
    const artCenterX = (border.art.centerX / 100) * canvasWidth;
    const artCenterY = (border.art.centerY / 100) * canvasHeight;
    const artRadius = 10 * scaleFactor;

    ctx.strokeStyle = "rgba(128, 0, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(artCenterX, artCenterY, artRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw crosshairs
    ctx.beginPath();
    ctx.moveTo(artCenterX - artRadius * 2, artCenterY);
    ctx.lineTo(artCenterX + artRadius * 2, artCenterY);
    ctx.moveTo(artCenterX, artCenterY - artRadius * 2);
    ctx.lineTo(artCenterX, artCenterY + artRadius * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(128, 0, 255, 1)";
    ctx.font = `bold ${6 * scaleFactor}px sans-serif`;
    ctx.fillText("ART CENTER", artCenterX + artRadius * 2, artCenterY);
  }

  // Draw each text position
  const textPositions = border.textPositions;
  for (const [key, position] of Object.entries(textPositions)) {
    if (!position || position.x === undefined) continue;

    const pos = getScaledPosition(position, canvasWidth, canvasHeight, scaleFactor);
    const color = DEBUG_COLORS[key] || "rgba(128, 128, 128, 0.4)";

    // Stroke rectangle (no fill)
    ctx.strokeStyle = color.replace("0.4", "0.8");
    ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

    // Label
    ctx.fillStyle = color.replace("0.4", "1");
    ctx.font = `bold ${5 * scaleFactor}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(key.toUpperCase(), pos.x + 2, pos.y + 2);
  }

  ctx.restore();
}

/**
 * Renders a card to the provided visible canvas and returns the full offscreen canvas.
 * The visible canvas shows only the card (no margin), while the returned offscreen
 * canvas includes the full margin for export purposes.
 */
export async function renderCard(
  canvas: HTMLCanvasElement,
  options: RenderOptions,
): Promise<HTMLCanvasElement> {
  const {
    card,
    border,
    backgroundUrl,
    backgroundTransform,
    dpi,
    symbolsData,
    debug,
  } = options;
  const { fullWidth, fullHeight, cardWidth, cardHeight, marginPixels } =
    getCanvasDimensions(dpi);
  const scaleFactor = dpi / BASE_DPI;
  const borderManaSymbols = border.manaSymbols;

  // Visible canvas shows card-only area (no margin)
  if (canvas.width !== cardWidth || canvas.height !== cardHeight) {
    canvas.width = cardWidth;
    canvas.height = cardHeight;
  }

  // Offscreen canvas at full size (including margin for border bleed)
  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = fullWidth;
  offscreenCanvas.height = fullHeight;

  const ctx = offscreenCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const visibleCtx = canvas.getContext("2d");
  if (!visibleCtx) {
    throw new Error("Failed to get visible canvas context");
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
  if (border.textPositions.artist) {
    fontFamilies.add(
      border.textPositions.artist.fontFamily || "Georgia, serif",
    );
  }
  if (border.textPositions.copyright) {
    fontFamilies.add(
      border.textPositions.copyright.fontFamily || "Georgia, serif",
    );
  }

  // Load all fonts in parallel
  await Promise.all([...fontFamilies].map(ensureFontLoaded));

  // Preload artist icon if defined
  if (border.textPositions.artist?.icon) {
    try {
      await loadImageCached(border.textPositions.artist.icon);
    } catch (e) {
      console.warn("Failed to load artist icon:", e);
    }
  }

  // Clear canvas and reset shadow state
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, fullWidth, fullHeight);

  // Load and draw background
  if (backgroundUrl) {
    try {
      const bgImage = await loadImageCached(proxyImageUrl(backgroundUrl));
      drawImageCover(
        ctx,
        bgImage,
        fullWidth,
        fullHeight,
        border.art,
        backgroundTransform,
      );
    } catch (e) {
      console.warn("Failed to load background image:", e);
    }
  }

  // Load and draw border
  const borderColor = determineBorderColor(card.colors);
  const isLegendary = card.frame_effects?.includes("legendary");
  const borderImageValue = border.images[borderColor] || border.images.C;
  const borderImageUrl = getBorderImageUrl(borderImageValue, "base");

  if (borderImageUrl) {
    try {
      const borderImage = await loadImageCached(proxyImageUrl(borderImageUrl));
      ctx.drawImage(borderImage, 0, 0, fullWidth, fullHeight);
    } catch (e) {
      console.warn("Failed to load border image:", e);
    }
  }

  // Draw legendary overlay if card has legendary frame effect
  if (isLegendary) {
    const legendaryUrl = getBorderImageUrl(borderImageValue, "legendary");

    if (legendaryUrl) {
      try {
        const legendaryImage = await loadImageCached(
          proxyImageUrl(legendaryUrl),
        );
        ctx.drawImage(legendaryImage, 0, 0, fullWidth, fullHeight);
      } catch (e) {
        console.warn("Failed to load legendary overlay:", e);
      }
    }
  }

  // Draw power/toughness box overlay if card has power and toughness
  if (card.power !== undefined && card.toughness !== undefined) {
    const ptOverlayUrl = getBorderImageUrl(borderImageValue, "powerToughness");

    if (ptOverlayUrl) {
      try {
        const ptOverlayImage = await loadImageCached(proxyImageUrl(ptOverlayUrl));
        ctx.drawImage(ptOverlayImage, 0, 0, fullWidth, fullHeight);
      } catch (e) {
        console.warn("Failed to load power/toughness overlay:", e);
      }
    }
  }

  // Draw card name with dynamic font sizing
  const namePos = getScaledPosition(
    border.textPositions.name,
    fullWidth,
    fullHeight,
    scaleFactor,
  );
  // Reset shadow state before drawing text
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const nameFontSize = fitTextToWidth(
    ctx,
    card.name,
    namePos.width,
    namePos.fontSize,
    namePos.fontFamily,
  );
  ctx.font = `${nameFontSize}px ${namePos.fontFamily}`;
  ctx.fillStyle = namePos.color;
  ctx.textAlign = namePos.align as CanvasTextAlign;
  ctx.textBaseline = "top";

  // Calculate X position based on horizontal alignment
  let nameX = namePos.x;
  if (namePos.align === "center") {
    nameX = namePos.x + namePos.width / 2;
  } else if (namePos.align === "right") {
    nameX = namePos.x + namePos.width;
  }

  // Calculate Y position based on vertical alignment
  const nameVerticalAlign = border.textPositions.name.verticalAlign || "top";
  let nameY = namePos.y;
  if (nameVerticalAlign === "center") {
    nameY = namePos.y + (namePos.height - nameFontSize) / 2;
  } else if (nameVerticalAlign === "bottom") {
    nameY = namePos.y + namePos.height - nameFontSize;
  }

  ctx.fillText(card.name, nameX, nameY);

  // Draw mana cost
  if (card.mana_cost) {
    const manaPos = getScaledPosition(
      border.textPositions.manaCost,
      fullWidth,
      fullHeight,
      scaleFactor,
    );
    const manaAlign = (border.textPositions.manaCost.align || "right") as "left" | "center" | "right";
    const manaVerticalAlign = (border.textPositions.manaCost.verticalAlign || "top") as "top" | "center" | "bottom";
    await drawManaCost(
      ctx,
      card.mana_cost,
      manaPos.x,
      manaPos.y,
      manaPos.width,
      manaPos.height,
      manaPos.fontSize,
      scaleFactor,
      manaAlign,
      manaVerticalAlign,
      borderManaSymbols,
      symbolsData,
    );
  }

  // Draw type line with dynamic font sizing
  const typePos = getScaledPosition(
    border.textPositions.typeLine,
    fullWidth,
    fullHeight,
    scaleFactor,
  );
  // Reset shadow state before drawing text
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const typeFontSize = fitTextToWidth(
    ctx,
    card.type_line,
    typePos.width,
    typePos.fontSize,
    typePos.fontFamily,
  );
  ctx.font = `${typeFontSize}px ${typePos.fontFamily}`;
  ctx.fillStyle = typePos.color;
  ctx.textAlign = typePos.align as CanvasTextAlign;
  ctx.textBaseline = "top";

  // Calculate X position based on horizontal alignment
  let typeX = typePos.x;
  if (typePos.align === "center") {
    typeX = typePos.x + typePos.width / 2;
  } else if (typePos.align === "right") {
    typeX = typePos.x + typePos.width;
  }

  // Calculate Y position based on vertical alignment
  const typeVerticalAlign = border.textPositions.typeLine.verticalAlign || "top";
  let typeY = typePos.y;
  if (typeVerticalAlign === "center") {
    typeY = typePos.y + (typePos.height - typeFontSize) / 2;
  } else if (typeVerticalAlign === "bottom") {
    typeY = typePos.y + typePos.height - typeFontSize;
  }

  ctx.fillText(card.type_line, typeX, typeY);

  // Draw oracle text and flavor text with dynamic font sizing
  let oracleEndY = 0;
  const hasOracleText = !!card.oracle_text;
  const hasFlavorText = !!card.flavor_text && !!border.textPositions.flavorText;

  if (hasOracleText || hasFlavorText) {
    const oraclePos = getScaledPosition(
      border.textPositions.oracleText,
      fullWidth,
      fullHeight,
      scaleFactor,
    );

    const flavorPos = hasFlavorText
      ? getScaledPosition(
          border.textPositions.flavorText!,
          fullWidth,
          fullHeight,
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
          oraclePos.width,
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

    // Calculate vertical alignment offset
    const totalContentHeight = calculateTotalHeight(fontSize);
    const verticalAlign = border.textPositions.oracleText.verticalAlign || "top";
    let verticalOffset = 0;
    if (verticalAlign === "center") {
      verticalOffset = (availableHeight - totalContentHeight) / 2;
    } else if (verticalAlign === "bottom") {
      verticalOffset = availableHeight - totalContentHeight;
    }

    // Starting Y position with vertical alignment applied
    const startY = oraclePos.y + verticalOffset;

    // Draw oracle text with calculated font size
    if (hasOracleText) {
      const oracleHeight = await drawTextWithManaSymbols(
        ctx,
        card.oracle_text!,
        oraclePos.x,
        startY,
        oraclePos.width,
        fontSize,
        oraclePos.fontFamily,
        oraclePos.color,
        borderManaSymbols,
        symbolsData,
      );
      oracleEndY = startY + oracleHeight;
    }

    // Draw flavor text below oracle text with divider
    if (hasFlavorText && flavorPos) {
      const gapSize = fontSize * 1.5; // Total gap between oracle and flavor text

      // Calculate Y position based on oracle text end (or use default if no oracle text)
      const flavorY = hasOracleText ? oracleEndY + gapSize : startY;

      // Draw divider line centered between oracle and flavor text with faded ends
      if (hasOracleText) {
        const dividerY = oracleEndY + gapSize / 2;
        const fadeWidth = oraclePos.width * 0.15; // Fade out over 15% of width at each end

        // Create gradient that fades at both ends
        const gradient = ctx.createLinearGradient(
          oraclePos.x,
          dividerY,
          oraclePos.x + oraclePos.width,
          dividerY,
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(fadeWidth / oraclePos.width, "rgba(0, 0, 0, 0.3)");
        gradient.addColorStop(1 - fadeWidth / oraclePos.width, "rgba(0, 0, 0, 0.3)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.moveTo(oraclePos.x, dividerY);
        ctx.lineTo(oraclePos.x + oraclePos.width, dividerY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 * scaleFactor;
        ctx.stroke();
      }

      // Draw flavor text with calculated font size
      ctx.font = `italic ${fontSize}px ${flavorPos.fontFamily}`;
      ctx.fillStyle = flavorPos.color;
      ctx.textAlign = flavorPos.align as CanvasTextAlign;
      ctx.textBaseline = "top";

      const lines = wrapText(ctx, card.flavor_text!, oraclePos.width);
      const lineHeight = fontSize * 1.3;

      lines.forEach((line, index) => {
        ctx.fillText(line, oraclePos.x, flavorY + index * lineHeight);
      });
    }
  }

  // Draw power/toughness
  if (card.power && card.toughness && border.textPositions.powerToughness) {
    const ptPos = getScaledPosition(
      border.textPositions.powerToughness,
      fullWidth,
      fullHeight,
      scaleFactor,
    );
    ctx.font = `bold ${ptPos.fontSize}px ${ptPos.fontFamily}`;
    ctx.fillStyle = ptPos.color;
    ctx.textAlign = ptPos.align as CanvasTextAlign;
    ctx.textBaseline = "top";

    const ptText = `${card.power}/${card.toughness}`;

    // Calculate X position based on horizontal alignment
    let ptX = ptPos.x;
    if (ptPos.align === "center") {
      ptX = ptPos.x + ptPos.width / 2;
    } else if (ptPos.align === "right") {
      ptX = ptPos.x + ptPos.width;
    }

    // Calculate Y position based on vertical alignment
    const ptVerticalAlign = border.textPositions.powerToughness.verticalAlign || "top";
    let ptY = ptPos.y;
    if (ptVerticalAlign === "center") {
      ptY = ptPos.y + (ptPos.height - ptPos.fontSize) / 2;
    } else if (ptVerticalAlign === "bottom") {
      ptY = ptPos.y + ptPos.height - ptPos.fontSize;
    }

    ctx.fillText(ptText, ptX, ptY);
  }

  // Draw loyalty
  if (card.loyalty && border.textPositions.loyalty) {
    const loyaltyPos = getScaledPosition(
      border.textPositions.loyalty,
      fullWidth,
      fullHeight,
      scaleFactor,
    );
    ctx.font = `bold ${loyaltyPos.fontSize}px ${loyaltyPos.fontFamily}`;
    ctx.fillStyle = loyaltyPos.color;
    ctx.textAlign = loyaltyPos.align as CanvasTextAlign;
    ctx.textBaseline = "top";

    // Calculate X position based on horizontal alignment
    let loyaltyX = loyaltyPos.x;
    if (loyaltyPos.align === "center") {
      loyaltyX = loyaltyPos.x + loyaltyPos.width / 2;
    } else if (loyaltyPos.align === "right") {
      loyaltyX = loyaltyPos.x + loyaltyPos.width;
    }

    // Calculate Y position based on vertical alignment
    const loyaltyVerticalAlign = border.textPositions.loyalty.verticalAlign || "top";
    let loyaltyY = loyaltyPos.y;
    if (loyaltyVerticalAlign === "center") {
      loyaltyY = loyaltyPos.y + (loyaltyPos.height - loyaltyPos.fontSize) / 2;
    } else if (loyaltyVerticalAlign === "bottom") {
      loyaltyY = loyaltyPos.y + loyaltyPos.height - loyaltyPos.fontSize;
    }

    ctx.fillText(card.loyalty, loyaltyX, loyaltyY);
  }

  // Draw artist name with icon
  if (card.artist && border.textPositions.artist) {
    const artistPos = getScaledPosition(
      border.textPositions.artist,
      fullWidth,
      fullHeight,
      scaleFactor,
    );
    ctx.font = `${artistPos.fontSize}px ${artistPos.fontFamily}`;
    ctx.fillStyle = artistPos.color;

    const iconPath = border.textPositions.artist.icon;
    const iconSize = artistPos.fontSize * 1.2;
    const hasIcon = iconPath && imageCache.has(iconPath);
    const iconSpacing = hasIcon ? iconSize + 2 * scaleFactor : 0;
    const textWidth = ctx.measureText(card.artist).width;
    const totalContentWidth = iconSpacing + textWidth;

    // Calculate X position based on horizontal alignment
    let contentStartX = artistPos.x;
    if (artistPos.align === "center") {
      contentStartX = artistPos.x + (artistPos.width - totalContentWidth) / 2;
    } else if (artistPos.align === "right") {
      contentStartX = artistPos.x + artistPos.width - totalContentWidth;
    }

    // Calculate Y position based on vertical alignment
    const artistVerticalAlign = border.textPositions.artist.verticalAlign || "center";
    let textY: number;
    if (artistVerticalAlign === "top") {
      textY = artistPos.y + artistPos.fontSize / 2;
    } else if (artistVerticalAlign === "bottom") {
      textY = artistPos.y + artistPos.height - artistPos.fontSize / 2;
    } else {
      // center (default)
      textY = artistPos.y + artistPos.height / 2;
    }

    // Draw icon if available, tinted to match text color
    if (hasIcon) {
      const iconImg = imageCache.get(iconPath!)!;
      const iconY = textY - iconSize / 2;

      // Create temp canvas to tint the icon
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = iconSize;
      tempCanvas.height = iconSize;
      const tempCtx = tempCanvas.getContext("2d")!;

      // Draw icon
      tempCtx.drawImage(iconImg, 0, 0, iconSize, iconSize);

      // Tint with text color using source-in composite
      tempCtx.globalCompositeOperation = "source-in";
      tempCtx.fillStyle = artistPos.color;
      tempCtx.fillRect(0, 0, iconSize, iconSize);

      // Draw tinted icon to main canvas
      ctx.drawImage(tempCanvas, contentStartX, iconY);
    }

    // Draw text after icon
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(card.artist, contentStartX + iconSpacing, textY);
  }

  // Draw copyright text
  if (border.textPositions.copyright) {
    const copyrightPos = getScaledPosition(
      border.textPositions.copyright,
      fullWidth,
      fullHeight,
      scaleFactor,
    );
    ctx.font = `${copyrightPos.fontSize}px ${copyrightPos.fontFamily}`;
    ctx.fillStyle = copyrightPos.color;
    ctx.textAlign = copyrightPos.align as CanvasTextAlign;
    ctx.textBaseline = "middle";

    const currentYear = new Date().getFullYear();
    const copyrightText = `© ${currentYear} Custom Proxy • NOT FOR SALE`;

    // Calculate X position based on horizontal alignment
    let copyrightX = copyrightPos.x;
    if (copyrightPos.align === "center") {
      copyrightX = copyrightPos.x + copyrightPos.width / 2;
    } else if (copyrightPos.align === "right") {
      copyrightX = copyrightPos.x + copyrightPos.width;
    }

    // Calculate Y position based on vertical alignment
    const copyrightVerticalAlign = border.textPositions.copyright.verticalAlign || "center";
    let copyrightY: number;
    if (copyrightVerticalAlign === "top") {
      copyrightY = copyrightPos.y + copyrightPos.fontSize / 2;
    } else if (copyrightVerticalAlign === "bottom") {
      copyrightY = copyrightPos.y + copyrightPos.height - copyrightPos.fontSize / 2;
    } else {
      // center (default)
      copyrightY = copyrightPos.y + copyrightPos.height / 2;
    }

    ctx.fillText(copyrightText, copyrightX, copyrightY);
  }

  // Draw debug bounding boxes if debug mode is enabled
  if (debug) {
    drawDebugBoundingBoxes(ctx, border, fullWidth, fullHeight, scaleFactor);
  }

  // Copy card portion (without margin) from offscreen to visible canvas
  visibleCtx.drawImage(
    offscreenCanvas,
    marginPixels,
    marginPixels, // source x, y (skip margin)
    cardWidth,
    cardHeight, // source size
    0,
    0, // dest x, y
    cardWidth,
    cardHeight, // dest size
  );

  // Return the full offscreen canvas for export purposes
  return offscreenCanvas;
}

export function downloadPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/**
 * Export a rendered card with configurable margin.
 * @param renderCanvas - The full-size canvas (including margin) from rendering
 * @param filename - Base filename without extension
 * @param dpi - The DPI used for rendering
 * @param marginMm - Margin to include in export (0-5mm)
 */
export function exportPng(
  renderCanvas: HTMLCanvasElement,
  filename: string,
  dpi: number,
  marginMm: number = 0,
): void {
  const { fullWidth, fullHeight, marginPixels } = getCanvasDimensions(dpi);

  // Clamp margin to valid range (0-5mm)
  const clampedMargin = Math.max(0, Math.min(5, marginMm));
  const exportMarginPixels = Math.round((clampedMargin / MM_PER_INCH) * dpi);

  // Calculate how much to crop from each side
  const cropMargin = marginPixels - exportMarginPixels;
  const exportWidth = fullWidth - 2 * cropMargin;
  const exportHeight = fullHeight - 2 * cropMargin;

  // Create export canvas with cropped dimensions
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportWidth;
  exportCanvas.height = exportHeight;

  const ctx = exportCanvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(
    renderCanvas,
    cropMargin,
    cropMargin, // source x, y
    exportWidth,
    exportHeight, // source size
    0,
    0, // dest x, y
    exportWidth,
    exportHeight, // dest size
  );

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
}
