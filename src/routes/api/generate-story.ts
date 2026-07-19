import { createFileRoute } from '@tanstack/react-router'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

          const system =
            language === 'it'
              ? `Sei uno scrittore di favole tattili per bambini ciechi e ipovedenti. Scrivi ESCLUSIVAMENTE in italiano. Genera una storia molto breve in ESATTAMENTE 3 paragrafi separati da una riga vuota. Ogni paragrafo: 1-2 frasi, massimo 22 parole, linguaggio semplice, sensoriale (tatto, suoni, profumi), adatto a bambini 4-8 anni. Nessun titolo, nessuna intestazione, nessuna numerazione. Solo il testo dei 3 paragrafi.`
              : `You are a writer of tactile fairy tales for blind and visually impaired children. Write ONLY in English. Produce a very short story in EXACTLY 3 paragraphs separated by a blank line. Each paragraph: 1-2 sentences, max 22 words, simple sensory language (touch, sounds, smells), for ages 4-8. No title, no headings, no numbering. Just the 3 paragraphs.`

          const user =
            language === 'it'
              ? `Idea del bambino: "${idea || 'un piccolo giardino della luna'}". Scrivi la favola in italiano.`
              : `Child's idea: "${idea || 'a little moon garden'}". Write the fairy tale in English.`

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
              temperature: 0.9,
              max_tokens: 400,
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
