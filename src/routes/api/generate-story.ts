import { createFileRoute } from '@tanstack/react-router'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
}

export const Route = createFileRoute('/api/generate-story')({
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
              ? `Sei uno scrittore di favole tattili per bambini ciechi e ipovedenti. Scrivi ESCLUSIVAMENTE in italiano. Ogni richiesta deve essere una storia nuova inventata da zero: cambia protagonista, azione, oggetto tattile, piccolo problema e finale. Non riusare frasi modello, non copiare esempi, non produrre la stessa narrazione con parole diverse. Genera una storia molto breve in ESATTAMENTE 3 paragrafi separati da una riga vuota. Ogni paragrafo: 1-2 frasi, massimo 24 parole, linguaggio semplice, sensoriale (tatto, suoni, profumi), adatto a bambini 4-8 anni. Nessun titolo, nessuna intestazione, nessuna numerazione. Solo il testo dei 3 paragrafi.`
              : `You are a writer of tactile fairy tales for blind and visually impaired children. Write ONLY in English. Every request must be a newly invented story from scratch: change the protagonist, action, tactile object, small problem, and ending. Do not reuse template sentences, do not copy examples, and do not produce the same narration with different words. Produce a very short story in EXACTLY 3 paragraphs separated by a blank line. Each paragraph: 1-2 sentences, max 24 words, simple sensory language (touch, sounds, smells), for ages 4-8. No title, no headings, no numbering. Just the 3 paragraphs.`

          const user =
            language === 'it'
              ? `Idea del bambino: "${idea || 'sorprendimi con una nuova favola tattile'}". Seme creativo interno: ${requestSeed}. Usa questo seme per inventare dettagli unici e non stamparlo. Scrivi una favola nuova in italiano, non una variante di una storia già scritta.`
              : `Child's idea: "${idea || 'surprise me with a new tactile fairy tale'}". Internal creative seed: ${requestSeed}. Use this seed to invent unique details and do not print it. Write a new fairy tale in English, not a variant of a story already written.`

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
              temperature: 1.15,
              top_p: 0.97,
              presence_penalty: 0.7,
              frequency_penalty: 0.45,
              max_tokens: 500,
            }),
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
          const story = (data.choices?.[0]?.message?.content || '').trim()
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
