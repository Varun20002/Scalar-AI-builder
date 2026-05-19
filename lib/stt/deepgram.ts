// Deepgram v4+ SDK — use DefaultDeepgramClient
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DefaultDeepgramClient } = require('@deepgram/sdk')

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY is not set')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const deepgram = new DefaultDeepgramClient(apiKey)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: 'nova-3',
    smart_format: true,
    diarize: true,
    punctuate: true,
    mimetype: mimeType,
  })

  if (error) throw new Error(`Deepgram error: ${JSON.stringify(error)}`)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript as string | undefined
  if (!transcript) throw new Error('No transcript returned from Deepgram')

  return transcript
}
