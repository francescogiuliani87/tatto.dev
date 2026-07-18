
## Cosa costruiamo

Il repo `thatsfaso/tact` non è una libreria npm: è una singola pagina `index.html` (~2000 righe) con logica vanilla JS. Portiamo **solo** le due parti richieste — traduzione Braille (IT/EN, Grado 1) e generazione STL — come moduli TypeScript riutilizzabili, più una route demo minima che le mostra funzionanti.

**Fuori scope in questo passo:** generazione della storia via WebLLM (dipende da modelli in-browser e WebGPU — argomento a sé), riconoscimento vocale, sfondo WebGL, UI React originale. Se poi vorrai anche quelli, li aggiungiamo dopo.

**Licenza:** Tact è MIT — includiamo un file `THIRD_PARTY_NOTICES.md` con la nota di attribuzione.

## Struttura file

```text
src/lib/tact/
  braille.ts         // BRAILLE_MAP IT/EN, normalisePunctuation,
                     // textToBrailleCells, translateBraille, layoutLines
  stl.ts             // writer STL binario: dot(), box(),
                     // roundedSlab(), rasterizeIll(), generateSTL()
  shapes.ts          // caricamento shapes/index.json + keyword match
                     // (plurali/diminutivi IT + EN)
  types.ts           // BrailleCell, PageLayout, STLOptions, Shape
  index.ts           // barrel export

public/tact-shapes/  // ~90 SVG copiati dal repo (animals/, buildings/,
                     // nature/, objects/, people/, vehicles/) + index.json

src/routes/
  index.tsx          // sostituisce il placeholder: demo di porting

THIRD_PARTY_NOTICES.md  // attribuzione MIT a thatsfaso/tact
```

## Moduli TypeScript

**`braille.ts`** — porta 1:1 la logica deterministica del repo:
- `normalisePunctuation(text): string`
- `translateBraille(text: string, lang: 'it' | 'en'): string` (stringa di caratteri Unicode Braille U+2800…)
- `textToBrailleCells(text, lang): BrailleCell[]` (array di dot pattern 1–6 per l'export STL)
- `layoutLines(cells, widths): BrailleCell[][]` (spezza in righe rispettando i margini)
- Costanti `CAP_INDICATOR`, `NUM_INDICATOR`, `BRAILLE_MAP` con i mapping IT ed EN, tipizzati.

**`stl.ts`** — porta il writer STL binario:
- `generateSTL(cells, opts): Blob` dove `opts` include dimensioni pagina in mm, raggio angoli, illustrazione (Uint8Array raster dallo shape SVG), numero pagina.
- Elicheri interni tipizzati: `tri`, `box`, `roundedRectPts`, `roundedSlab`, `dot`, `rasterizeIll` (usa `OffscreenCanvas` quando disponibile, fallback `<canvas>`).
- Dimensioni ISO 17049:2013 (Marburg Medium) come costanti esportate.

**`shapes.ts`** — indice illustrazioni:
- `loadShapeIndex(): Promise<Shape[]>` legge `/tact-shapes/index.json`.
- `matchShape(storyText, lang): Shape | null` — keyword match parola-intera sui `tags`, con gestione plurali/diminutivi IT ed EN come nell'originale.
- `loadShapeSVG(shape): Promise<string>` fetch dell'SVG dal path pubblico.

Tutti i moduli sono puramente browser-side: nessuna server function, nessuna dipendenza npm nuova.

## Route demo (`src/routes/index.tsx`)

Sostituisce il placeholder. UI minimale con shadcn (già in progetto):

1. Selettore lingua IT/EN.
2. Textarea per una frase di prova.
3. Preview live: caratteri Braille Unicode renderizzati grandi.
4. Bottone "Scarica STL" che chiama `generateSTL(...)` con una shape scelta dall'utente da un menu a tendina popolato da `shapes/index.json`, e triggera il download del `.stl` come `Blob`.
5. `head()` con titolo/description dedicati (no più default template).

Nessuna generazione automatica della storia (out of scope).

## Passi di esecuzione

1. Aggiungere `THIRD_PARTY_NOTICES.md` con testo MIT + attribuzione a `thatsfaso/tact`.
2. Copiare le 7 sottocartelle di `shapes/` + `index.json` in `public/tact-shapes/` (statico, servito così com'è).
3. Creare i 5 file in `src/lib/tact/` portando il JS del repo a TypeScript stretto (tipi espliciti su tutte le funzioni pubbliche, nessun `any` nelle firme).
4. Riscrivere `src/routes/index.tsx` con la demo.
5. Aggiornare `head()` in `src/routes/__root.tsx` (title, description, og) per non lasciare i placeholder "Lovable App" / "Lovable Generated Project".

## Verifiche prima di considerare fatto

- Il typecheck passa (strict).
- Aprendo `/`, "ciao mondo" in IT produce Braille Unicode corretto (`⠉⠊⠁⠕ ⠍⠕⠝⠙⠕`).
- Il download `.stl` scarica un file binario >0 byte e apribile in un viewer STL (verifichiamo header 80-byte + count triangoli).
- Selezionando una shape (es. "cat_sitting"), l'STL include il rilievo dell'illustrazione oltre ai punti Braille.

## Domanda aperta (rispondi in chat quando implementiamo)

Vuoi che la route demo stia su `/` (sostituendo il placeholder, consigliato) o su `/tact` con `/` che redirige lì? Default: su `/`.
