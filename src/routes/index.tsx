import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  generateSTL,
  loadShapeIndex,
  loadShapeSVG,
  pickShapeFromText,
  rasterizeIll,
  textToBrailleCells,
  translateBraille,
} from "@/lib/tact";
import type { Lang, ShapeIndex } from "@/lib/tact";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tact — Braille + STL demo" },
      {
        name: "description",
        content:
          "In-browser Grade 1 Braille translation (IT/EN) and printable STL page, ported from thatsfaso/tact.",
      },
      { property: "og:title", content: "Tact — Braille + STL demo" },
      {
        property: "og:description",
        content:
          "Turn a sentence into Grade 1 Braille and a printable 3D page, entirely client-side.",
      },
    ],
  }),
  component: Index,
});

const DEFAULT_TEXT_IT = "Ciao mondo! Una volpe custodiva un castello.";

function Index() {
  const [lang, setLang] = useState<Lang>("it");
  const [text, setText] = useState(DEFAULT_TEXT_IT);
  const [index, setIndex] = useState<ShapeIndex | null>(null);
  const [shape, setShape] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadShapeIndex()
      .then((idx) => {
        setIndex(idx);
        if (idx.shapes[0]) setShape(idx.shapes[0].name);
      })
      .catch((e: unknown) => setStatus(`Errore indice shape: ${String(e)}`));
  }, []);

  // Suggest a shape whenever the text or language changes.
  useEffect(() => {
    if (!index) return;
    const suggested = pickShapeFromText(text, lang);
    if (index.shapes.some((s) => s.name === suggested)) setShape(suggested);
  }, [text, lang, index]);

  const braillePreview = useMemo(() => translateBraille(text, lang), [text, lang]);

  async function handleDownload(): Promise<void> {
    setBusy(true);
    setStatus("Generazione STL…");
    try {
      const cells = textToBrailleCells(text, lang);
      let pillars: number[] = [];
      if (index && shape) {
        const svg = await loadShapeSVG(shape, index);
        pillars = await rasterizeIll(svg);
      }
      const buf = generateSTL(cells, { illPillars: pillars });
      const blob = new Blob([buf], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tact_${shape || "page"}.stl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus(`STL scaricato (${(buf.byteLength / 1024).toFixed(1)} kB).`);
    } catch (e) {
      setStatus(`Errore: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Tact — Braille + STL</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Traduzione Braille Grado 1 (IT/EN) e generazione di una pagina STL stampabile,
            portate come moduli TypeScript da{" "}
            <a
              className="underline"
              href="https://github.com/thatsfaso/tact"
              target="_blank"
              rel="noreferrer"
            >
              thatsfaso/tact
            </a>
            . Tutto in-browser.
          </p>
        </header>

        <section className="space-y-4 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium" htmlFor="lang">Lingua</label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="text">
              Testo
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium">Anteprima Braille (Unicode)</div>
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted p-4 text-2xl leading-relaxed">
              {braillePreview || " "}
            </pre>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-sm font-medium" htmlFor="shape">
                Illustrazione tattile
              </label>
              <select
                id="shape"
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                disabled={!index}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              >
                {index?.shapes.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.category} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy || !text.trim()}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? "Generazione…" : "Scarica STL"}
            </button>
          </div>

          {status && (
            <p className="text-xs text-muted-foreground" role="status">
              {status}
            </p>
          )}
        </section>

        <footer className="mt-8 text-xs text-muted-foreground">
          Codice sorgente originale MIT — vedi <code>THIRD_PARTY_NOTICES.md</code>.
        </footer>
      </div>
    </div>
  );
}
