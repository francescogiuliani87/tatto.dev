import { createFileRoute } from '@tanstack/react-router'

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
              ? `Sei uno scrittore di favole tattili per bambini ciechi e ipovedenti, stampate in Braille una pagina per paragrafo. Scrivi ESCLUSIVAMENTE in italiano. L'idea del bambino è obbligatoria: mantieni protagonista/tema, ma inventa una storia nuova da zero ogni volta (cambia azione, oggetto tattile, piccolo problema, finale). Non riusare frasi modello. Struttura: ESATTAMENTE 4 paragrafi separati da una riga vuota (1 apertura, 2 scoperta tattile, 3 piccolo problema/azione, 4 finale caldo). Ogni paragrafo: 2 frasi, 20-30 parole (max 35). Linguaggio semplice e sensoriale (tatto, suoni, profumi), 4-8 anni. Nessun titolo, nessuna numerazione. Solo i 4 paragrafi.`
              : `You are a writer of tactile fairy tales for blind and visually impaired children, printed in Braille one page per paragraph. Write ONLY in English. The child's idea is mandatory: keep the protagonist/theme, but invent a brand-new story from scratch each time (change action, tactile object, small problem, ending). Do not reuse template sentences. Structure: EXACTLY 4 paragraphs separated by a blank line (1 opening, 2 tactile discovery, 3 small problem/action, 4 warm ending). Each paragraph: 2 sentences, 20-30 words (max 35). Simple sensory language (touch, sounds, smells), ages 4-8. No title, no numbering. Just the 4 paragraphs.`

          const user =
            language === 'it'
              ? `Idea del bambino: "${idea || 'sorprendimi con una nuova favola tattile'}". Rispetta questa idea come centro della storia. Seme creativo interno: ${requestSeed}. Usa il seme per inventare dettagli unici e non stamparlo. Scrivi una favola nuova in italiano di 4 brevi paragrafi.`
              : `Child's idea: "${idea || 'surprise me with a new tactile fairy tale'}". Keep this idea at the center of the story. Internal creative seed: ${requestSeed}. Use the seed to invent unique details and do not print it. Write a new 4-short-paragraph fairy tale in English.`

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
              max_tokens: 700,
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
