import OpenAI from 'openai'

// Thin OpenAI adapter so the support-chat service stays testable and the
// provider is swappable via env (base URL / model). Returns null when no key
// is configured — callers fall back to keyword retrieval and refuse LLM answers.

let client: OpenAI | null = null

export function isLlmConfigured(): boolean {
  return !!process.env.LLM_API_KEY && process.env.LLM_API_KEY.length > 0
}

function getClient(): OpenAI | null {
  if (!isLlmConfigured()) return null
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
      baseURL: process.env.LLM_BASE_URL || undefined,
      timeout: 20_000,
      maxRetries: 1,
    })
  }
  return client
}

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const c = getClient()
  if (!c || texts.length === 0) return null
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
  const res = await c.embeddings.create({ model, input: texts })
  return res.data.map((d) => d.embedding)
}

export async function chatComplete(system: string, user: string): Promise<{ content: string | null; model: string }> {
  const c = getClient()
  if (!c) return { content: null, model: '' }
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'
  const res = await c.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  return { content: res.choices[0]?.message?.content ?? null, model }
}
