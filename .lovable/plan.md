# Ricostruzione nativa di Tact

Obiettivo: eliminare `public/tact/index.html` e il redirect. La home `/` diventa una vera pagina TanStack/React 19 con componenti nostri, grafica identica al pixel all'originale, e scorrimento titoli fluido perché parte del bundle Vite (niente più React UMD + JSX inline).

## Cosa costruiamo

Componenti in `src/components/tact/`:
- `TactHome.tsx` — layout principale (header, hero, input, controlli, footer)
- `FluidBackground.tsx` — sfondo WebGL identico (shader fluid), throttled a on-demand
- `HintMarquee.tsx` — ticker titoli preimpostati con Web Animations API + cloni dinamici
- `StoryPreview.tsx` — anteprima storia + Braille
- `ShapePicker.tsx` — griglia forme tattili con matching keyword
- `LanguageToggle.tsx`, `SfxToggle.tsx`, `DownloadButton.tsx`
- `sfx.ts` — Web Audio effects (già in `src/lib/tact/`? verifico)
- `webllm.ts` — client WebLLM con prompt IT/EN separati e assistant primer

Riuso moduli già portati in `src/lib/tact/`: `braille.ts`, `stl.ts`, `shapes.ts`.

## Stile

- Import font in `src/routes/__root.tsx` via `<link>` Google Fonts (Instrument Serif + Geist), niente CDN Tailwind.
- Tailwind v4 già configurato → tutte le classi originali funzionano nativamente.
- CSS globale minimo in `src/styles.css` per keyframes / utilities custom (`.drift`, gradients).

## Routing

- `src/routes/index.tsx` renderizza `<TactHome />` direttamente (via `useSuspenseQuery` per lo shape index).
- Elimino `public/tact/index.html`, `public/tact/tailwind.css`. Mantengo solo `public/tact/shapes/` e `public/tact/assets/` come statici.
- `head()` con titolo/description reali dell'app.

## Marquee fluido (fix vero)

- Renderizzato come React con array duplicato N volte in base a `window.innerWidth / listWidth * 2`.
- Animato con Web Animations API su `transform: translate3d`, durata calcolata da distanza per tenere velocità costante (~120 px/s).
- Composited su GPU, no reflow, pausa on hover, `prefers-reduced-motion` friendly.

## Rischi / note

- WebLLM è pesante (~200 MB modello): lo carico lazy on first use, come nell'originale.
- Shader WebGL: porto il codice GLSL così com'è in un componente con `useEffect` per init/cleanup.
- Tempo: è una riscrittura ampia (~800-1000 righe di JSX portate a TSX modulare). Procedo in un colpo unico.

## Deliverable

Alla fine `/` mostra la stessa UI dell'originale ma:
- zero iframe, zero HTML statico, zero React UMD, zero Babel/JSX inline
- ticker fluidissimo (bundle nativo, no doppio runtime React)
- codice modulare TSX modificabile in futuro

Confermi e procedo?
