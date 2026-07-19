# Tatto.dev

A modern, production-grade fork of [thatsfaso/tact](https://github.com/thatsfaso/tact) — a tool that turns short fairy tales into printable tactile pages (Braille text + raised illustrations) for blind and low-vision children.

Live: **https://tatto.dev**

Original project by **Iliano Fasolino**. Released under MIT (see `THIRD_PARTY_NOTICES.md`).

---

## What this fork adds on top of the original

The original is a single static `index.html` that loads React, Babel and Tailwind from CDNs at runtime, compiles JSX in the browser, and runs the LLM entirely on-device via WebLLM. This fork keeps the exact same UX and visual identity, but re-engineers everything around it for speed, quality, SEO and maintainability.

### 1. Build & runtime architecture

- Migrated from a static CDN-based HTML page to a **TanStack Start v1 + React 19 + Vite 7** app deployed to Cloudflare Workers (edge).
- Removed **Babel standalone** (JSX is now precompiled) and the **Tailwind CDN** (Tailwind v4 is built into the bundle via `src/styles.css`).
- JS payload reduced by **~94%** (from ~3.1 MB to ~180 KB on first load).
- App is served at the site root `/` (no `/tact/` subfolder, no iframe).
- Proper edge caching: `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=86400`.

### 2. AI story generation — replaced WebLLM with Agnes AI

- The original downloads a ~200 MB LLM into the browser (Llama 3.2 1B via WebLLM) and often froze low-end devices.
- This fork calls **Agnes AI** (`agnes-2.0-flash`) server-side via a TanStack server route: `src/routes/api/public/generate-story.ts`.
- No model download, works instantly on any device including mobile.
- 25 s timeout with proper 504 handling.
- Dedicated Italian / English system prompts in the style of Gianni Rodari, Julia Donaldson, Beatrice Alemagna and Oliver Jeffers.
- Enforces a 4-paragraph tactile-story structure with one specific tactile detail, banned "sight" vocabulary, and a warm non-preachy ending.
- `sanitizeStory()` post-processor kills degenerate repetition and enforces sentence-final punctuation.
- Language selected in the header is honored end-to-end (fixes the original bug where the IT toggle still produced English stories).

### 3. UI / UX additions

- **Hamburger menu + "How it works" panel** (mobile, tablet, desktop) with 5 steps, monochrome SVG illustrations matching the template, and full IT/EN localization synced with the header toggle via `MutationObserver`.
- **Reader mode**: when a story is generated, the header, hamburger button, marquee hint ticker, footer and side decorations auto-hide for a distraction-free reading layout.
- **Custom writing overlay** with glassmorphism, spinner and simulated progress bar during generation.
- **Responsive story reader**: Braille page and printed text stack vertically under 900 px, with tuned font sizes and top margin so nothing overlaps the header.
- **Braille logo mark**: the "T" of "Tatto.dev" is rendered as a real Braille cell (dots 2-3-4-5) built with pure CSS `radial-gradient` + layered `box-shadow`, and scales fluidly with `clamp()` between mobile and desktop.
- **Fluid marquee**: preset story ideas now animate on the **Web Animations API** (compositor-thread, GPU-accelerated, ~120 px/s constant speed) instead of the CSS keyframe scroller in the original.
- **Background decorations**: photorealistic grayscale bear cub (left) and fox (right) sitting behind the content on ≥1280 px screens, hidden on smaller viewports.
- **Bolder Braille dots** on the home hero (9 px, solid radial gradient, deeper shadow) for a stronger tactile look.

### 4. STL / Braille output

- Ported the original geometry to a strict TypeScript module: `src/lib/tact/stl.ts`.
- Marburg Medium spec: 2 mm base plate, **0.85 mm** Braille dot height, extruded illustration pillars.
- Grade 1 Braille tables for **Italian and English** in `src/lib/tact/braille.ts`, with a Vitest suite (`braille.test.ts`) verifying character-by-character mappings.
- Shape matching + ~90 tactile SVG icons in `public/tact-shapes/` served from the site root.

### 5. SEO & discoverability (none of this exists in the original)

- Real page metadata: `<title>` "Tatto.dev — Tactile Braille stories to 3D print", meta description, author, theme color.
- Full **Open Graph** and **Twitter Card** tags.
- **JSON-LD** structured data (`WebSite`, `WebApplication`, `Person` for Iliano Fasolino) injected in the root HTML.
- Canonical URL pointing to `https://tatto.dev/`.
- `public/robots.txt` and a **dynamic sitemap** at `src/routes/sitemap[.]xml.ts` with auto-updated `lastmod`.
- Custom favicon (`public/favicon.svg`, black square + white "T") wired into both the SPA shell and the fallback HTML.

### 6. Code quality

- Full TypeScript, strict mode.
- Modular `src/lib/tact/` (braille, stl, shapes, types) with unit tests.
- Deleted unused assets (e.g. the 1.3 MB orphaned `fox-right.png`).
- No secrets in the client bundle — the Agnes API key lives only in the server environment (`AGNES_API_KEY`).

---

## Tech stack

- TanStack Start v1 (SSR + server functions) on Cloudflare Workers
- React 19 + Vite 7
- Tailwind CSS v4 (native `@import`, no legacy config file)
- Three.js (STL preview viewer)
- Agnes AI (`agnes-2.0-flash`) for story generation
- Vitest for Braille table tests

## Project layout

```
src/
  routes/
    __root.tsx                    # SEO head, JSON-LD, root layout
    index.tsx                     # Serves the Tatto app at /
    api/public/generate-story.ts  # Agnes AI proxy (server-side)
    sitemap[.]xml.ts              # Dynamic sitemap
  lib/tact/
    braille.ts / braille.test.ts  # Grade 1 IT/EN Braille
    stl.ts                        # Marburg Medium STL generator
    shapes.ts / types.ts          # Shape matching + asset loader
public/
  tact/index.html                 # The Tatto UI (served at /)
  tact-shapes/                    # Tactile SVG library
  favicon.svg, robots.txt
```

## Environment

- `AGNES_API_KEY` — required, server-side only.

## Credits

Original **Tact** concept, design and geometry: **Iliano Fasolino** — https://github.com/thatsfaso/tact (MIT).
This fork keeps the original visual language and print spec, and rebuilds the platform around it.
