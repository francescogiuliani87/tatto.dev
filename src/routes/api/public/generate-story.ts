import { createFileRoute } from '@tanstack/react-router'

function sanitizeStory(input: string): string {
  let s = (input || '').replace(/\r/g, '').trim()
  // Split into paragraphs, keep at most first 4.
  const paras = s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 4)
  const cleaned = paras.map((p) => {
    const words = p.split(/\s+/)
    const out: string[] = []
    let lastRoot = ''
    let repeats = 0
    for (const w of words) {
      const root = w.toLowerCase().replace(/[^a-zàèéìòù]/gi, '').slice(0, 5)
      if (root && root === lastRoot) {
        repeats++
        if (repeats >= 2) break // 3rd repeat of same root → stop paragraph
      } else {
        repeats = 0
        lastRoot = root
      }
      out.push(w)
    }
    let text = out.join(' ').trim()
    // Ensure paragraph ends with sentence punctuation.
    if (text && !/[.!?…]$/.test(text)) text = text.replace(/[,;:\-–—]+$/, '') + '.'
    return text
  })
  return cleaned.join('\n\n')
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
}

export const Route = createFileRoute('/api/public/generate-story')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const { prompt, lang } = (await request.json()) as { prompt?: string; lang?: string }
          const idea = String(prompt || '').slice(0, 400)
          const language = lang === 'it' ? 'it' : 'en'
          const apiKey = process.env.AGNES_API_KEY
          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Missing AGNES_API_KEY' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...CORS },
            })
          }

          const requestSeed =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`

          const system =
            language === 'it'
              ? `Sei un autore di favole per bambini di 4-8 anni, nella tradizione di Gianni Rodari, Beatrice Alemagna e Julia Donaldson. Scrivi ESCLUSIVAMENTE in italiano, in forma di favola tattile stampata in Braille (una pagina per paragrafo).

QUALITÀ (obbligatoria):
- Vera storia con arco narrativo: un protagonista con un desiderio o una piccola paura, un incontro o una scoperta, una scelta gentile, un finale che scalda il cuore.
- Immagini poetiche e concrete, non frasi generiche o didascaliche. Niente morali esplicite ("la lezione è..."), niente "e vissero felici e contenti".
- UN dettaglio tattile specifico e memorabile (la corteccia ruvida come pane raffermo, il muschio morbido come una nuvola bagnata, un sassolino tiepido di sole). Uno solo, ben scelto — non un elenco.
- Sensi oltre la vista: tatto, suono, profumo, temperatura. Vietate le parole "vedere/guardare/vista".
- Nome proprio per il protagonista. Verbi vivi, ritmo. Nessuna parola difficile o astratta.

STRUTTURA: esattamente 4 paragrafi separati da una riga vuota.
1) Apertura: chi è il protagonista e cosa desidera o teme, in un luogo preciso.
2) Incontro o scoperta con il dettaglio tattile specifico.
3) Piccolo problema e scelta gentile del protagonista.
4) Finale caldo e concreto (un gesto, non una morale).

Ogni paragrafo: 2 frasi, 22-32 parole. Nessun titolo, nessuna numerazione, nessuna intestazione. Solo i 4 paragrafi.`
              : `You are an author of fairy tales for children ages 4-8, in the tradition of Julia Donaldson, Oliver Jeffers and Beatrice Alemagna. Write ONLY in English, as a tactile fairy tale printed in Braille (one page per paragraph).

QUALITY (required):
- A real story arc: a named protagonist with a wish or small fear, an encounter or discovery, a kind choice, a warm ending.
- Poetic, concrete images — never generic or preachy lines. No explicit morals ("the lesson is..."), no "happily ever after".
- ONE specific, memorable tactile detail (bark rough like stale bread, moss soft as a damp cloth, a pebble warm from the sun). Just one, well chosen — not a list.
- Senses beyond sight: touch, sound, smell, temperature. Banned words: "see/look/watch/sight".
- Give the protagonist a name. Living verbs, rhythm. No difficult or abstract words.

STRUCTURE: exactly 4 paragraphs separated by a blank line.
1) Opening: who the protagonist is and what they wish or fear, in a precise place.
2) Encounter or discovery with the specific tactile detail.
3) Small problem and the protagonist's kind choice.
4) Warm, concrete ending (a gesture, not a moral).

Each paragraph: 2 sentences, 22-32 words. No title, no numbering, no headings. Only the 4 paragraphs.`

          const user =
            language === 'it'
              ? `Spunto del bambino: "${idea || 'sorprendimi con una favola tattile inedita'}". Tienilo al centro come protagonista o tema. Inventa un ambiente preciso (bosco all'alba, cucina della nonna, spiaggia dopo la pioggia...), un nome per il protagonista e UN dettaglio tattile specifico e originale. Seme creativo interno: ${requestSeed} (non stamparlo). Scrivi ora la favola in italiano, 4 paragrafi.`
              : `Child's spark: "${idea || 'surprise me with a fresh tactile fairy tale'}". Keep it at the heart of the story as protagonist or theme. Invent a precise setting (forest at dawn, grandmother's kitchen, beach after rain...), a name for the protagonist and ONE specific, original tactile detail. Internal creative seed: ${requestSeed} (do not print it). Write the fairy tale now in English, 4 paragraphs.`

          const upstream = await fetch('https://apihub.agnes-ai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'agnes-2.0-flash',
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
              ],
              temperature: 0.95,
              top_p: 0.92,
              presence_penalty: 0.4,
              frequency_penalty: 0.55,
              max_tokens: 650,
              stop: ['\n\n\n'],
            }),
            signal: AbortSignal.timeout(25_000),
          })


          if (!upstream.ok) {
            const text = await upstream.text().catch(() => '')
            return new Response(
              JSON.stringify({ error: `Agnes ${upstream.status}: ${text.slice(0, 200)}` }),
              { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } },
            )
          }

          const data = (await upstream.json()) as {
            choices?: Array<{ message?: { content?: string } }>
          }
          let story = (data.choices?.[0]?.message?.content || '').trim()

          // Sanitize: remove degenerate repetitive tails (same root word repeated,
          // or the same word repeated 3+ times in a row).
          story = sanitizeStory(story)

          if (!story) {
            return new Response(JSON.stringify({ error: 'Empty story' }), {
              status: 502,
              headers: { 'Content-Type': 'application/json', ...CORS },
            })
          }

          return new Response(JSON.stringify({ story }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...CORS },
          })
        } catch (err) {
          return new Response(
            JSON.stringify({ error: (err as Error).message || 'Unknown error' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } },
          )
        }
      },
    },
  },
})
