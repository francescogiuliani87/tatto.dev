// Types shared across the Tact port (Braille + STL + shape matching).
//
// A Braille cell is one of:
//   - number[]  → the dot positions raised in that cell (1..6). Empty [] means
//     a blank cell (also a legal word-wrap break point).
//   - 'BR'      → explicit line break.
export type BrailleCell = number[] | "BR";

export type Lang = "it" | "en";

export interface Shape {
  name: string;
  file: string; // e.g. "animals/cat_sitting.svg"
  category: string;
  tags: string[];
  description: string;
  natural_width_mm: number;
  natural_height_mm: number;
  has_fill: boolean;
  source_url: string;
  license: string;
}

export interface ShapeIndex {
  version: string;
  updated: string;
  notes: string;
  shapes: Shape[];
}
