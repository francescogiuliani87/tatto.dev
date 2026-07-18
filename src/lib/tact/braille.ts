// Grade 1 (uncontracted) Braille translation for Italian and English.
// Ported from thatsfaso/tact — see THIRD_PARTY_NOTICES.md.
//
// Grade 1 is a deterministic character → cell mapping with no contractions,
// so this pure-TS translator is exact, works offline, and has zero deps.
// Letters a–z are identical between Italian 6-dot and English UEB Grade 1;
// Italian accented vowels and shared punctuation are included below.

import type { BrailleCell, Lang } from "./types";

export const BRAILLE_MAP: Readonly<Record<string, readonly number[]>> = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4],
  g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5], k: [1, 3],
  l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5],
  p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4],
  t: [2, 3, 4, 5], u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6],
  x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
  à: [1, 2, 3, 5, 6], è: [2, 3, 4, 6], é: [1, 2, 3, 4, 5, 6],
  ì: [3, 4], ò: [3, 4, 6], ù: [2, 3, 4, 5, 6],
  â: [1, 6], ê: [1, 2, 6], î: [1, 4, 6], ô: [1, 4, 5, 6], û: [1, 5, 6],
  ç: [1, 2, 3, 4, 6], ñ: [1, 2, 4, 5, 6], ü: [1, 2, 5, 6],
  ".": [2, 5, 6], ",": [2], ";": [2, 3], ":": [2, 5], "?": [2, 6],
  "!": [2, 3, 5], "'": [3], "-": [3, 6], '"': [2, 3, 6],
  "(": [1, 2, 6], ")": [3, 4, 5], "/": [3, 4],
  "1": [1], "2": [1, 2], "3": [1, 4], "4": [1, 4, 5], "5": [1, 5],
  "6": [1, 2, 4], "7": [1, 2, 4, 5], "8": [1, 2, 5], "9": [2, 4], "0": [2, 4, 5],
};

export const CAP_INDICATOR: readonly number[] = [6];
export const NUM_INDICATOR: readonly number[] = [3, 4, 5, 6];

/**
 * Fold typographic punctuation onto the ASCII forms the mapping table knows.
 * Language models and smart-quote keyboards emit curly quotes, ellipses, and
 * long dashes constantly; anything the table misses would become a blank cell
 * (and a blank cell is a legal word-wrap point), so `C'era` could split.
 */
export function normalisePunctuation(text: string): string {
  return String(text)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/[\u00A0\u2007\u202F]/g, " ");
}

/**
 * Convert text into an array of Braille cells suitable for STL generation.
 * `lang` is accepted for API parity with the upstream project; the mapping
 * itself is identical for `it` and `en` in Grade 1.
 */
export function textToBrailleCells(text: string, _lang: Lang = "it"): BrailleCell[] {
  const cells: BrailleCell[] = [];
  let inNumber = false;
  const chars = Array.from(normalisePunctuation(text));
  for (const raw of chars) {
    if (raw === "\n") { cells.push("BR"); inNumber = false; continue; }
    if (raw === " " || raw === "\t") { cells.push([]); inNumber = false; continue; }
    if (raw >= "0" && raw <= "9") {
      if (!inNumber) { cells.push([...NUM_INDICATOR]); inNumber = true; }
      const g = BRAILLE_MAP[raw];
      cells.push(g ? [...g] : []);
      continue;
    }
    inNumber = false;
    const lower = raw.toLowerCase();
    const glyph = BRAILLE_MAP[lower];
    if (glyph === undefined) { cells.push([]); continue; }
    if (raw !== lower) cells.push([...CAP_INDICATOR]);
    cells.push([...glyph]);
  }
  return cells;
}

/**
 * Render text as a string of Unicode Braille characters (U+2800..U+28FF).
 * Useful for on-screen preview. Word-break/wrap is not performed here.
 */
export function translateBraille(text: string, lang: Lang = "it"): string {
  const cells = textToBrailleCells(text, lang);
  let out = "";
  for (const c of cells) {
    if (c === "BR") { out += "\n"; continue; }
    if (c.length === 0) { out += " "; continue; }
    // Unicode Braille: dot 1 = bit 0, 2 = bit 1, 3 = bit 2, 4 = bit 3,
    // 5 = bit 4, 6 = bit 5. Base U+2800.
    let bits = 0;
    for (const d of c) bits |= 1 << (d - 1);
    out += String.fromCharCode(0x2800 + bits);
  }
  return out;
}

/**
 * Wrap cells into lines of maximum width. `widths[i]` gives the cap for line
 * `i` (the last value is reused if there are more lines than entries).
 * Word-break points are blank cells; if none fits, the line is hard-broken.
 */
export function layoutLines(
  cells: BrailleCell[],
  widths: readonly number[],
): BrailleCell[][] {
  const lines: BrailleCell[][] = [];
  let line: BrailleCell[] = [];
  let ls = -1;
  const cap = (): number => {
    const i = lines.length;
    return widths[i < widths.length ? i : widths.length - 1] ?? 21;
  };
  for (const c of cells) {
    if (c === "BR") { lines.push(line); line = []; ls = -1; continue; }
    line.push(c);
    if (Array.isArray(c) && c.length === 0) ls = line.length - 1;
    if (line.length >= cap()) {
      if (ls > 0) { lines.push(line.slice(0, ls)); line = line.slice(ls + 1); ls = -1; }
      else { lines.push(line); line = []; ls = -1; }
    }
  }
  if (line.length) lines.push(line);
  return lines;
}
