// Deepgram SDK v5 — uses DeepgramClient + listen.v1.media.transcribeFile
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DeepgramClient } = require('@deepgram/sdk')

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY is not set')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const deepgram = new DeepgramClient({ apiKey })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const response = await deepgram.listen.v1.media.transcribeFile(audioBuffer, {
    model: 'nova-3',
    smart_format: true,
    diarize: true,
    punctuate: true,
    mimetype: mimeType,
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const transcript = response?.results?.channels?.[0]?.alternatives?.[0]?.transcript as string | undefined

  if (!transcript) throw new Error('No transcript returned from Deepgram')

  return transcript
}
