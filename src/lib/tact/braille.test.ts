import { describe, it, expect } from "vitest";
import {
  BRAILLE_MAP,
  CAP_INDICATOR,
  NUM_INDICATOR,
  textToBrailleCells,
  normalisePunctuation,
} from "./braille";
import type { BrailleCell } from "./types";

/**
 * Cell-by-cell verification that a translated story maps every character to
 * the expected Braille glyph (Grade 1, IT/EN).
 */
function verifyStory(text: string): {
  ok: boolean;
  errors: string[];
  cells: BrailleCell[];
} {
  const normalised = normalisePunctuation(text);
  const cells = textToBrailleCells(text);
  const errors: string[] = [];

  const chars = Array.from(normalised);
  let ci = 0; // cursor into `cells`
  let inNumber = false;

  for (let i = 0; i < chars.length; i++) {
    const raw = chars[i];

    if (raw === "\n") {
      if (cells[ci] !== "BR") errors.push(`char ${i} '\\n' → expected BR, got ${JSON.stringify(cells[ci])}`);
      ci++;
      inNumber = false;
      continue;
    }
    if (raw === " " || raw === "\t") {
      const c = cells[ci];
      if (!Array.isArray(c) || c.length !== 0)
        errors.push(`char ${i} ' ' → expected empty cell, got ${JSON.stringify(c)}`);
      ci++;
      inNumber = false;
      continue;
    }

    // Digits: expect number indicator on the first digit of a run.
    if (raw >= "0" && raw <= "9") {
      if (!inNumber) {
        const ind = cells[ci];
        if (!Array.isArray(ind) || JSON.stringify(ind) !== JSON.stringify([...NUM_INDICATOR]))
          errors.push(`char ${i} '${raw}' → missing NUM indicator, got ${JSON.stringify(ind)}`);
        ci++;
        inNumber = true;
      }
      const expected = BRAILLE_MAP[raw];
      const got = cells[ci];
      if (!Array.isArray(got) || JSON.stringify(got) !== JSON.stringify([...expected]))
        errors.push(`char ${i} '${raw}' → glyph mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
      ci++;
      continue;
    }
    inNumber = false;

    const lower = raw.toLowerCase();
    const glyph = BRAILLE_MAP[lower];

    if (glyph === undefined) {
      // Unknown char → produced as empty cell.
      const c = cells[ci];
      if (!Array.isArray(c) || c.length !== 0)
        errors.push(`char ${i} '${raw}' unmapped → expected empty cell, got ${JSON.stringify(c)}`);
      ci++;
      continue;
    }

    // Uppercase letter → expect capital indicator before the glyph.
    if (raw !== lower) {
      const ind = cells[ci];
      if (!Array.isArray(ind) || JSON.stringify(ind) !== JSON.stringify([...CAP_INDICATOR]))
        errors.push(`char ${i} '${raw}' → missing CAP indicator, got ${JSON.stringify(ind)}`);
      ci++;
    }

    const got = cells[ci];
    if (!Array.isArray(got) || JSON.stringify(got) !== JSON.stringify([...glyph]))
      errors.push(`char ${i} '${raw}' → glyph mismatch: expected ${JSON.stringify(glyph)}, got ${JSON.stringify(got)}`);
    ci++;
  }

  if (ci !== cells.length)
    errors.push(`extra cells at end: consumed ${ci}, total ${cells.length}`);

  return { ok: errors.length === 0, errors, cells };
}

const SAMPLE_STORIES = [
  // Italian sample — mimics a real generated story (accents, punctuation, quotes normalised).
  `Nina, la piccola volpe rossa, cercava una stella caduta nel bosco all'alba, tremando di freddo e curiosità.

Toccò la corteccia di un abete: era ruvida come pane raffermo, e profumava di resina calda.

Trovò un pettirosso con l'ala rotta: invece di tenersi la stella, la posò accanto a lui per scaldarlo.

Il pettirosso cantò piano; Nina sentì il petto tiepido, e capì che il bosco era una casa grande.`,

  // English sample.
  `Milo, the shy little owl, waited on a bent branch for the moon to rise over the quiet marsh.

He touched the bark with one careful claw — rough like stale bread, warm from the last of the sun.

A tiny frog was tangled in reeds; Milo unpicked the knot with his beak instead of hooting for help.

The frog blinked, hopped, and Milo felt the marsh breathe: soft, cool, wide as a promise.`,

  // Edge cases: numbers, capitals, quotes, ellipsis, em-dash.
  `C'era 1 drago... "Ciao!" — disse Anna, a 8 anni.`,
];

describe("Braille translation — cell-by-cell verification", () => {
  it("has correct dot patterns for Italian accented vowels", () => {
    expect(BRAILLE_MAP["à"]).toEqual([1, 2, 3, 5, 6]);
    expect(BRAILLE_MAP["è"]).toEqual([2, 3, 4, 6]);
    expect(BRAILLE_MAP["é"]).toEqual([1, 2, 3, 4, 5, 6]);
    expect(BRAILLE_MAP["ì"]).toEqual([3, 4]);
    expect(BRAILLE_MAP["ò"]).toEqual([3, 4, 6]);
    expect(BRAILLE_MAP["ù"]).toEqual([2, 3, 4, 5, 6]);
  });

  it("emits capital indicator before uppercase letters", () => {
    const cells = textToBrailleCells("Ab");
    expect(cells[0]).toEqual([...CAP_INDICATOR]);
    expect(cells[1]).toEqual([...BRAILLE_MAP["a"]]);
    expect(cells[2]).toEqual([...BRAILLE_MAP["b"]]);
  });

  it("emits number indicator once per run of digits", () => {
    const cells = textToBrailleCells("12 3");
    expect(cells[0]).toEqual([...NUM_INDICATOR]);
    expect(cells[1]).toEqual([...BRAILLE_MAP["1"]]);
    expect(cells[2]).toEqual([...BRAILLE_MAP["2"]]);
    expect(cells[3]).toEqual([]); // space
    expect(cells[4]).toEqual([...NUM_INDICATOR]); // new run
    expect(cells[5]).toEqual([...BRAILLE_MAP["3"]]);
  });

  it("normalises curly quotes, ellipsis, em-dash, nbsp", () => {
    const n = normalisePunctuation("\u201CC\u2019era\u2026\u00A0\u2014fine\u201D");
    expect(n).toBe('"C\'era... -fine"');
  });

  SAMPLE_STORIES.forEach((story, i) => {
    it(`sample story #${i + 1}: every character maps to the correct glyph`, () => {
      const { ok, errors } = verifyStory(story);
      if (!ok) console.error(errors.slice(0, 10).join("\n"));
      expect(errors).toEqual([]);
      expect(ok).toBe(true);
    });
  });
});
