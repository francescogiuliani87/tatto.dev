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
              ? `Sei uno scrittore di favole tattili per bambini ciechi e ipovedenti. Scrivi ESCLUSIVAMENTE in italiano. L'idea del bambino è obbligatoria: mantieni protagonista/tema richiesto, ma inventa una storia nuova da zero ogni volta. Cambia azione, oggetto tattile, piccolo problema e finale. Non riusare frasi modello, non copiare esempi, non produrre la stessa narrazione con parole diverse. Struttura: ESATTAMENTE 5 paragrafi separati da una riga vuota, con arco narrativo chiaro (1: apertura e protagonista; 2: scoperta tattile; 3: piccolo problema; 4: azione o incontro; 5: finale caldo e sensoriale). Ogni paragrafo: 2-3 frasi, 30-55 parole. Linguaggio semplice, ricco di dettagli sensoriali (tatto, suoni, profumi, temperature), adatto a bambini 4-8 anni. Nessun titolo, nessuna intestazione, nessuna numerazione. Solo il testo dei 5 paragrafi.`
              : `You are a writer of tactile fairy tales for blind and visually impaired children. Write ONLY in English. The child's idea is mandatory: keep the requested protagonist/theme, but invent a brand-new story from scratch every time. Change the action, tactile object, small problem, and ending. Do not reuse template sentences, do not copy examples, and do not produce the same narration with different words. Structure: EXACTLY 5 paragraphs separated by a blank line, with a clear arc (1: opening and protagonist; 2: tactile discovery; 3: small problem; 4: action or encounter; 5: warm sensory ending). Each paragraph: 2-3 sentences, 30-55 words. Simple language, rich sensory detail (touch, sounds, smells, temperature), for ages 4-8. No title, no headings, no numbering. Just the 5 paragraphs.`

          const user =
            language === 'it'
              ? `Idea del bambino: "${idea || 'sorprendimi con una nuova favola tattile'}". Rispetta questa idea come centro della storia. Seme creativo interno: ${requestSeed}. Usa il seme per inventare dettagli unici e non stamparlo. Scrivi una favola nuova in italiano di 5 paragrafi con arco narrativo completo.`
              : `Child's idea: "${idea || 'surprise me with a new tactile fairy tale'}". Keep this idea at the center of the story. Internal creative seed: ${requestSeed}. Use the seed to invent unique details and do not print it. Write a new 5-paragraph fairy tale in English with a complete narrative arc.`

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
              temperature: 1.1,
              top_p: 0.97,
              presence_penalty: 0.7,
              frequency_penalty: 0.4,
              max_tokens: 1100,
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
