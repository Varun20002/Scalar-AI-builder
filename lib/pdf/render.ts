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
    const puppeteer = await import('puppeteer-core')
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

    let executablePath: string
    let launchArgs: string[]

    if (isServerless) {
      const chromium = await import('@sparticuz/chromium-min')
      executablePath = await chromium.default.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      )
      launchArgs = [...(chromium.default.args || []), '--no-sandbox', '--disable-setuid-sandbox']
    } else {
      // Local dev: use system Chrome — no serverless flags
      executablePath =
        process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/usr/bin/google-chrome'
      launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }

    browser = await puppeteer.default.launch({
      args: launchArgs,
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    // networkidle0 ensures Google Fonts (Fraunces + Plus Jakarta Sans) finish loading
    // before the PDF is captured. Timeout is generous to allow font CDN in serverless.
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })

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
