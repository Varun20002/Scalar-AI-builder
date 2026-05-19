import { PDFContent, PersonaType } from '../llm/prompts/pdfSections'
import { renderEngineerTemplate } from './templates/engineer'
import { renderSeniorTemplate } from './templates/senior'
import { renderStudentTemplate } from './templates/student'

export function selectTemplate(personaType: PersonaType): (content: PDFContent) => string {
  switch (personaType) {
    case 'senior':
      return renderSeniorTemplate
    case 'student':
      return renderStudentTemplate
    default:
      return renderEngineerTemplate
  }
}

export function renderHTML(content: PDFContent): string {
  const template = selectTemplate(content.persona_type)
  return template(content)
}

export async function renderPDF(html: string): Promise<Buffer> {
  let browser = null

  try {
    // Use @sparticuz/chromium-min for Vercel serverless compatibility
    const chromium = await import('@sparticuz/chromium-min')
    const puppeteer = await import('puppeteer-core')

    // In production (Vercel), chromium.executablePath() gives the right binary
    // In dev, fall back to locally installed Chrome
    let executablePath: string
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      executablePath = await chromium.default.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      )
    } else {
      // Local dev: use system Chrome
      executablePath =
        process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/usr/bin/google-chrome'
    }

    browser = await puppeteer.default.launch({
      args: [...(chromium.default.args || []), '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    if (browser) await browser.close()
  }
}

export async function uploadPDFToSupabase(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.storage
    .from('pdfs')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) throw new Error(`Supabase upload error: ${error.message}`)

  const { data } = supabase.storage.from('pdfs').getPublicUrl(fileName)
  return data.publicUrl
}
