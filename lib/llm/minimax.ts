import OpenAI from 'openai'

// MiniMax uses an OpenAI-compatible API
// Model: MiniMax-Text-01 (latest)
// Base URL: https://api.minimaxi.chat/v1

const BASE_URL = 'https://api.minimaxi.chat/v1'

function getClient(): OpenAI {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) throw new Error('MINIMAX_API_KEY is not set')

  return new OpenAI({
    apiKey,
    baseURL: BASE_URL,
  })
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface JSONModeOptions {
  model?: string
  temperature?: number
  maxRetries?: number
}

// Parse JSON from model output robustly — handles markdown fences
function extractJSON(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1])
  }
  // Try direct parse
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1) {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1))
  }
  return JSON.parse(text)
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  options: JSONModeOptions = {}
): Promise<T> {
  const { model = 'MiniMax-M2.5', temperature = 0.3, maxRetries = 2 } = options
  const client = getClient()

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // MiniMax does not support response_format — rely on extractJSON parser
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from MiniMax')

      return extractJSON(content) as T
    } catch (err) {
      lastError = err as Error
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
      }
    }
  }
  throw lastError
}

export async function chatText(
  messages: ChatMessage[],
  options: JSONModeOptions = {}
): Promise<string> {
  const { model = 'MiniMax-M2.5', temperature = 0.5, maxRetries = 2 } = options
  const client = getClient()

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from MiniMax')

      return content
    } catch (err) {
      lastError = err as Error
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
      }
    }
  }
  throw lastError
}
