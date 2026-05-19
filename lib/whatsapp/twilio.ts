import twilio from 'twilio'

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) throw new Error('Twilio credentials not set')
  return twilio(accountSid, authToken)
}

const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

export async function sendWhatsAppText(to: string, body: string): Promise<string> {
  const client = getClient()
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  const message = await client.messages.create({
    from: FROM,
    to: toFormatted,
    body,
  })

  return message.sid
}

export async function sendWhatsAppPDF(
  to: string,
  body: string,
  pdfUrl: string
): Promise<string> {
  const client = getClient()
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  const message = await client.messages.create({
    from: FROM,
    to: toFormatted,
    body,
    mediaUrl: [pdfUrl],
  })

  return message.sid
}

export function getSandboxJoinCode(): string {
  return process.env.TWILIO_SANDBOX_CODE || 'join <your-sandbox-code>'
}

export function getSandboxNumber(): string {
  return FROM.replace('whatsapp:', '')
}

export function getWaJoinLink(): string {
  const code = getSandboxJoinCode()
  const number = getSandboxNumber().replace('+', '')
  return `https://wa.me/${number}?text=${encodeURIComponent(code)}`
}
