// Binary STL writer for a printable Braille page + tactile illustration.
// Ported from thatsfaso/tact — see THIRD_PARTY_NOTICES.md.
//
// Geometry follows ISO 17049:2013 (Marburg Medium), with dot height
// deliberately over-designed (~0.85 mm vs the 0.5 mm paper spec) to
// compensate for the shrinkage FDM printers introduce.

import { layoutLines } from "./braille";
import type { BrailleCell } from "./types";

// ── Page geometry (millimetres) ───────────────────────────────────────────
export const PAGE_W = 150;
export const PAGE_H = 150;
export const BASE_H = 0.5;
export const CORNER_R = 10;

// Dots
export const DOT_R = 0.8;
export const DOT_TOTAL_H = 0.85;
export const CYL_H = 0.35;

// Text-zone layout
export const TZ_X = 10;
export const CELL_W = 6.0;
export const LINE_H = 10.0;
export const LINE_Y0 = 135;

// Illustrated pages (odd): 7 full-width rows on top, 6 narrow rows on the
// left beside a bottom-right picture. Text-only pages (even): 13 full rows.
export const LINE_WIDTHS: readonly number[] = [21, 21, 21, 21, 21, 21, 21, 12, 12, 12, 12, 12, 12];
export const LINE_WIDTHS_FULL: readonly number[] = [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21];

// Dot offsets within a cell, indexed by dot number (1..6).
const DOFF: ReadonlyArray<readonly [number, number] | null> = [
  null, [0, 5], [0, 2.5], [0, 0], [2.5, 5], [2.5, 2.5], [2.5, 0],
];

// Illustration zone (bottom-right corner).
export const ILL_X = 86;
export const ILL_Y = 12;
export const ILL_W = 54;
export const ILL_H = 54;
export const ILL_ABOVE = 0.9;
export const ILL_PIX = 2;

// ── Geometry helpers ──────────────────────────────────────────────────────
type Vec3 = readonly [number, number, number];
// [nx, ny, nz, ax, ay, az, bx, by, bz, cx, cy, cz]
type Triangle = [number, number, number, number, number, number, number, number, number, number, number, number];

function tri(tris: Triangle[], a: Vec3, b: Vec3, c: Vec3): void {
  const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2];
  const bx = c[0] - a[0], by = c[1] - a[1], bz = c[2] - a[2];
  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  tris.push([nx / l, ny / l, nz / l, a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]]);
}

function box(tris: Triangle[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
  const T = (a: Vec3, b: Vec3, c: Vec3) => tri(tris, a, b, c);
  T([x0, y0, z0], [x1, y1, z0], [x1, y0, z0]); T([x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
  T([x0, y0, z1], [x1, y0, z1], [x1, y1, z1]); T([x0, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  T([x0, y0, z0], [x1, y0, z0], [x1, y0, z1]); T([x0, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  T([x0, y1, z0], [x1, y1, z1], [x1, y1, z0]); T([x0, y1, z0], [x0, y1, z1], [x1, y1, z1]);
  T([x0, y0, z0], [x0, y0, z1], [x0, y1, z1]); T([x0, y0, z0], [x0, y1, z1], [x0, y1, z0]);
  T([x1, y0, z0], [x1, y1, z0], [x1, y1, z1]); T([x1, y0, z0], [x1, y1, z1], [x1, y0, z1]);
}

function roundedRectPts(x0: number, y0: number, x1: number, y1: number, r: number, seg: number): Array<[number, number]> {
  r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  const pts: Array<[number, number]> = [];
  const corners: Array<[number, number, number, number]> = [
    [x1 - r, y0 + r, -90, 0],
    [x1 - r, y1 - r, 0, 90],
    [x0 + r, y1 - r, 90, 180],
    [x0 + r, y0 + r, 180, 270],
  ];
  for (const c of corners) {
    const a0 = c[2] * Math.PI / 180, a1 = c[3] * Math.PI / 180;
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (a1 - a0) * i / seg;
      pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
    }
  }
  return pts;
}

function roundedSlab(tris: Triangle[], x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, r: number, seg: number): void {
  const pts = roundedRectPts(x0, y0, x1, y1, r, seg);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, n = pts.length;
  const T = (a: Vec3, b: Vec3, c: Vec3) => tri(tris, a, b, c);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    T([cx, cy, z1], [p[0], p[1], z1], [q[0], q[1], z1]);
    T([cx, cy, z0], [q[0], q[1], z0], [p[0], p[1], z0]);
    T([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1]);
    T([p[0], p[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]);
  }
}

function dot(tris: Triangle[], cx: number, cy: number): void {
  const PI2 = Math.PI * 2, S = 8, R = 4;
  const zB = BASE_H, zC = zB + CYL_H, hH = DOT_TOTAL_H - CYL_H;
  const T = (a: Vec3, b: Vec3, c: Vec3) => tri(tris, a, b, c);
  for (let i = 0; i < S; i++) {
    const a0 = (i / S) * PI2, a1 = ((i + 1) / S) * PI2;
    T([cx, cy, zB], [cx + DOT_R * Math.cos(a0), cy + DOT_R * Math.sin(a0), zB], [cx + DOT_R * Math.cos(a1), cy + DOT_R * Math.sin(a1), zB]);
  }
  for (let i = 0; i < S; i++) {
    const a0 = (i / S) * PI2, a1 = ((i + 1) / S) * PI2;
    const x0 = cx + DOT_R * Math.cos(a0), y0 = cy + DOT_R * Math.sin(a0);
    const x1 = cx + DOT_R * Math.cos(a1), y1 = cy + DOT_R * Math.sin(a1);
    T([x0, y0, zB], [x0, y0, zC], [x1, y1, zC]);
    T([x0, y0, zB], [x1, y1, zC], [x1, y1, zB]);
  }
  const vH = (p: number, t: number): Vec3 => [
    cx + DOT_R * Math.cos(p) * Math.cos(t),
    cy + DOT_R * Math.cos(p) * Math.sin(t),
    zC + hH * Math.sin(p),
  ];
  for (let ring = 0; ring < R; ring++) {
    const p0 = (ring / R) * (Math.PI / 2), p1 = ((ring + 1) / R) * (Math.PI / 2);
    for (let i = 0; i < S; i++) {
      const t0 = (i / S) * PI2, t1 = ((i + 1) / S) * PI2;
      if (ring === R - 1) {
        T(vH(p0, t0), vH(p0, t1), [cx, cy, zC + hH]);
      } else {
        const v00 = vH(p0, t0), v01 = vH(p0, t1), v10 = vH(p1, t0), v11 = vH(p1, t1);
        T(v00, v10, v11); T(v00, v11, v01);
      }
    }
  }
}

/**
 * Rasterize an SVG string to a flat `[x, y, x, y, ...]` list of illustration
 * pillar coordinates (mm). Uses a canvas (aspect-preserving, contain-fit,
 * centred in the corner zone) and picks pixels that are opaque and dark.
 */
export function rasterizeIll(svgText: string): Promise<number[]> {
  return new Promise((resolve) => {
    const pw = Math.round(ILL_W / ILL_PIX);
    const ph = Math.round(ILL_H / ILL_PIX);
    const canvas = document.createElement("canvas");
    canvas.width = pw;
    canvas.height = ph;
    const ctx = canvas.getContext("2d");
    if (!ctx) { resolve([]); return; }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pw, ph);
    const blobUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      const iw = img.width || 1, ih = img.height || 1;
      const s = Math.min(pw / iw, ph / ih);
      const dw = iw * s, dh = ih * s, dx = (pw - dw) / 2, dy = (ph - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      URL.revokeObjectURL(blobUrl);
      const d = ctx.getImageData(0, 0, pw, ph).data;
      const pil: number[] = [];
      for (let py = 0; py < ph; py++) {
        for (let px = 0; px < pw; px++) {
          const i = (py * pw + px) * 4;
          const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          if (d[i + 3] > 32 && lum < 160) {
            pil.push(ILL_X + px * ILL_PIX, ILL_Y + (ph - 1 - py) * ILL_PIX);
          }
        }
      }
      resolve(pil);
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve([]); };
    img.src = blobUrl;
  });
}

export interface GenerateSTLOptions {
  /** Illustration pillars (flat [x,y,...] mm). Empty for text-only pages. */
  illPillars?: readonly number[];
  /**
   * If true, use the full-width line profile with no illustration (typical
   * for even/back pages). Defaults to false.
   */
  fullWidth?: boolean;
}

/**
 * Build a binary STL for one Braille page, returned as an ArrayBuffer.
 * The 80-byte STL header identifies the file as coming from this port.
 */
export function generateSTL(
  brailleCells: BrailleCell[],
  opts: GenerateSTLOptions = {},
): ArrayBuffer {
  const { illPillars, fullWidth = false } = opts;
  const widths = fullWidth ? LINE_WIDTHS_FULL : LINE_WIDTHS;
  const tris: Triangle[] = [];

  roundedSlab(tris, 0, 0, PAGE_W, PAGE_H, 0, BASE_H, CORNER_R, 8);

  const lines = layoutLines(brailleCells, widths);
  lines.slice(0, widths.length).forEach((line, li) => {
    const cy = LINE_Y0 - li * LINE_H;
    line.forEach((cell, ci) => {
      if (!Array.isArray(cell) || cell.length === 0) return;
      const cx = TZ_X + ci * CELL_W;
      for (const d of cell) {
        const o = DOFF[d];
        if (o) dot(tris, cx + o[0], cy + o[1]);
      }
    });
  });

  if (illPillars && illPillars.length) {
    for (let i = 0; i < illPillars.length; i += 2) {
      box(
        tris,
        illPillars[i], illPillars[i + 1], BASE_H,
        illPillars[i] + ILL_PIX, illPillars[i + 1] + ILL_PIX, BASE_H + ILL_ABOVE,
      );
    }
  }

  const buf = new ArrayBuffer(80 + 4 + tris.length * 50);
  const dv = new DataView(buf);
  const header = "TACT Braille page - ported from thatsfaso/tact";
  for (let i = 0; i < 80; i++) dv.setUint8(i, header.charCodeAt(i) || 0);
  dv.setUint32(80, tris.length, true);
  let off = 84;
  for (const t of tris) {
    for (let fi = 0; fi < 12; fi++) { dv.setFloat32(off, t[fi], true); off += 4; }
    dv.setUint16(off, 0, true); off += 2;
  }
  return buf;
}
