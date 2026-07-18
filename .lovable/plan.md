## Obiettivo

Sostituire `public/tact/index.html` (1978 righe, servito via server route a `/`) con un'app React/TS bundlata da Vite. UI, comportamento, suoni, sfondo WebGL, generazione Braille/STL e integrazione WebLLM **identici**. Nessun CDN in produzione.

## Cosa cambia (perché è "meglio")

| Aspetto | Originale | Nuova versione |
|---|---|---|
| Tailwind | CDN (~350 KB, "not for production") | Già compilato via Tailwind v4 nel progetto |
| React | UMD dev 18.3 (~1.1 MB) | Bundle prod (~50 KB gz) |
| Babel-standalone | ~2 MB, compila JSX nel browser | Rimosso: JSX pre-compilato |
| Fonts Google | 3 richieste bloccanti | `<link>` in `__root.tsx` head |
| Codice | 1 file, tutto globale su `window.TACT` / `window.SFX` | Moduli TS tipizzati, import espliciti |
| Server route | Legge file HTML da disco a ogni GET | Route TSS React normale |
| First paint | ~2-3s (parse Babel+React) | ~200-400ms |

## Struttura file

```
src/lib/tact/
  braille.ts          già esiste — completare con normalizePunctuation
  stl.ts              già esiste — verificare geometria Marburg Medium
  shapes.ts           già esiste
  sfx.ts              NUOVO — Web Audio (chime, noiseBurst, startPad, startLoader)
  chrome-bg.ts        NUOVO — WebGL liquid chrome (shader + rAF loop)
  webllm.ts           NUOVO — tier selection + engine lifecycle
  types.ts            estendere con tipi UI

src/components/tact/
  App.tsx             root del flow (stati: idle, listening, thinking, reading)
  ChromeBackground.tsx  <canvas> + mount hook
  MicButton.tsx       pulsante registrazione con mic-pulse
  TranscriptView.tsx  testo dettato
  BraillePage.tsx     rendering pagina Braille (bd dots)
  DownloadPanel.tsx   selettore lingua, forma, STL download
  SoundToggle.tsx     toggle sound + localStorage

src/styles/tact.css   CSS custom (:root vars, .btn, .card, .bd, keyframes)
                      importato una volta in __root.tsx

src/routes/index.tsx  rimuovere server handler → component: TactApp

package.json          + @mlc-ai/web-llm (WebLLM in-browser)
```

## Piano di esecuzione (7 step)

1. **Estrai codice non-JSX** dall'HTML originale in moduli TS tipizzati:
   `sfx.ts`, `chrome-bg.ts`, `webllm.ts`. Nessuna modifica logica.
2. **Estrai CSS** in `src/styles/tact.css`, importato da `__root.tsx`. Aggiungi i `<link>` font in `head()` del root route.
3. **Ricostruisci l'albero JSX** partendo dal componente root (grep sui `React.createElement`/JSX nell'originale). Un componente per zona funzionale (~7 componenti).
4. **Sostituisci `window.TACT` / `window.SFX` globals** con import diretti dai moduli.
5. **Route `/`**: rimuovi il server handler, punta a `<TactApp/>`. Rimuovi `public/tact/` (mantieni solo `public/tact-shapes/` per gli SVG).
6. **Verifica funzionale** con Playwright headless: mic button clic, generazione Braille di frase test, download STL, toggle sound, sfondo WebGL renderizza. Screenshot side-by-side vs originale.
7. **Bundle check**: `bun run build`, confronta size chunk `/` con l'originale (~2.5 MB non-gz → target <300 KB gz).

## Rischi noti

- **WebLLM**: `@mlc-ai/web-llm` è ~200 KB gz ma carica modelli via WebGPU. Va caricato lazy (`import()` dentro handler) per non pesare sul first paint.
- **WebGL shader**: shader glsl inline è stringa, va copiata byte-per-byte (sensibile a whitespace? no, ma la copia deve essere esatta).
- **Marburg Medium**: geometria dots STL — già portata, ma richiede test con file STL scaricato aperto in un viewer.
- **Fedeltà visiva**: ogni animazione/transizione va replicata (rise, drift, mic-pulse, wave, float-soft). Il CSS le contiene già, basta preservarle.

## Dettagli tecnici

- `sfx.ts` esporta un singleton `sfx` con metodi `play(name)`, `startPad()`, `startLoader()`, `setEnabled(v)`. `AudioContext` lazy-initted al primo gesto utente (`useEffect` in `App.tsx` con `pointerdown`/`keydown` una volta).
- `chrome-bg.ts` esporta `mountChromeBackground(canvas)` che ritorna una funzione di cleanup (rimuove listeners, cancella rAF).
- `webllm.ts` esporta `loadEngine(onProgress)` che fa dynamic `import('@mlc-ai/web-llm')`, sceglie il tier via `_resolveTierIndex`, con fallback a smaller model on error.
- Nessun `useState` iniziale legge `localStorage` (violerebbe hydration su SSR): il tema/sound preference si legge in `useEffect` dopo mount. Il route è comunque SSR — se problemi, `ssr: false` per `/`.
- Bundle target: <300 KB gz per il route `/` escludendo WebLLM lazy.

## Fuori scope

- Nessun cambiamento di UI, testo, colori, font, animazioni.
- Nessuna ottimizzazione della logica Braille/STL (già ottimale).
- Nessun cambiamento del formato STL o compatibilità viewer.
