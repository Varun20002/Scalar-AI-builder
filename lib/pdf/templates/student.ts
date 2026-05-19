import { PDFContent } from '../../llm/prompts/pdfSections'

// Theme: student persona — warm, human, hopeful
// Palette: warm cream + Scaler green + soft shadows — approachable, not corporate

export function renderStudentTemplate(content: PDFContent): string {
  const sectionsHTML = content.sections
    .map(
      (s) => `
    <div class="section ${s.section_type}">
      <div class="section-number"></div>
      <h2 class="section-heading">${escapeHtml(s.heading)}</h2>
      <div class="section-body">${markdownToHtml(s.body)}</div>
      ${s.kb_citations.length ? `<p class="citation">From Scaler's program details</p>` : ''}
    </div>
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Scaler Story — ${escapeHtml(content.lead_name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #fffdf7;
    color: #1c1917;
    font-size: 14.5px;
    line-height: 1.75;
  }

  .page { max-width: 800px; margin: 0 auto; background: #fffdf7; }

  /* Hero — warm, human */
  .hero {
    padding: 52px 52px 44px;
    background: linear-gradient(160deg, #ecfdf5 0%, #d1fae5 40%, #fffdf7 100%);
    border-bottom: 3px solid #10b981;
    position: relative;
    overflow: hidden;
  }
  .hero::after {
    content: '✦';
    position: absolute;
    bottom: 16px; right: 52px;
    font-size: 48px;
    color: rgba(16,185,129,0.08);
  }
  .hero-greeting {
    font-size: 13px;
    font-weight: 600;
    color: #10b981;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .hero-headline {
    font-size: 28px;
    font-weight: 800;
    color: #111827;
    line-height: 1.25;
    margin-bottom: 14px;
    letter-spacing: -0.5px;
    max-width: 580px;
  }
  .hero-subheadline {
    font-size: 15px;
    color: #4b5563;
    line-height: 1.65;
    max-width: 500px;
  }
  .scaler-logo-text {
    position: absolute;
    top: 52px; right: 52px;
    font-size: 13px;
    font-weight: 800;
    color: #10b981;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  /* Intro */
  .intro {
    padding: 28px 52px;
    background: #f8fffe;
    border-bottom: 1px solid #d1fae5;
  }
  .intro p { color: #374151; line-height: 1.8; font-size: 14.5px; }

  /* Sections */
  .section {
    padding: 32px 52px;
    border-bottom: 1px solid #f3f4f6;
    position: relative;
  }
  .section:nth-child(even) { background: #f9fafb; }
  .section:nth-child(odd) { background: #fffdf7; }

  .section-heading {
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #d1fae5;
  }
  .section-body { color: #374151; font-size: 14px; line-height: 1.85; }
  .section-body strong { color: #111827; font-weight: 700; }
  .section-body ul { padding-left: 22px; margin: 10px 0; }
  .section-body li { margin-bottom: 6px; color: #4b5563; }
  .section-body p { margin-bottom: 10px; }

  /* Cost/financing section — extra warm */
  .cost_financing .section-body {
    background: #ecfdf5;
    padding: 16px 18px;
    border-radius: 8px;
    border: 1px solid #a7f3d0;
  }

  /* Placement reassurance */
  .placement .section-body {
    background: #fffbeb;
    padding: 16px 18px;
    border-radius: 8px;
    border: 1px solid #fde68a;
  }

  /* Entrance test */
  .entrance_test .section-body {
    border-left: 4px solid #10b981;
    padding-left: 14px;
  }

  .citation {
    margin-top: 8px;
    font-size: 10px;
    color: #9ca3af;
    font-style: italic;
  }

  /* Quote callout */
  .section-body blockquote {
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
    font-style: italic;
    color: #374151;
  }

  /* CTA — warm, encouraging */
  .cta {
    padding: 48px 52px;
    background: linear-gradient(160deg, #ecfdf5, #d1fae5);
    text-align: center;
    border-top: 3px solid #10b981;
  }
  .cta-headline {
    font-size: 22px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 10px;
    line-height: 1.3;
  }
  .cta-sub {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 24px;
    line-height: 1.6;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  .cta-button {
    display: inline-block;
    background: #10b981;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 14px 36px;
    border-radius: 8px;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
  }

  /* Footer */
  .footer {
    padding: 20px 52px;
    background: #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-brand { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; }
  .footer-note { font-size: 10px; color: #d1d5db; }
</style>
</head>
<body>
<div class="page">
  <div class="hero">
    <div class="scaler-logo-text">Scaler</div>
    <div class="hero-greeting">Just for you, ${escapeHtml(content.lead_name)}</div>
    <h1 class="hero-headline">${escapeHtml(content.hero_headline)}</h1>
    <p class="hero-subheadline">${escapeHtml(content.hero_subheadline)}</p>
  </div>

  <div class="intro"><p>${markdownToHtml(content.intro_paragraph)}</p></div>

  ${sectionsHTML}

  <div class="cta">
    <p class="cta-headline">${escapeHtml(content.closing_cta)}</p>
    <p class="cta-sub">The entrance test takes about 45 minutes and you can retake it. It's a start, not a judgement.</p>
    <span class="cta-button">Take the Entrance Test →</span>
  </div>

  <div class="footer">
    <span class="footer-brand">Scaler Academy</span>
    <span class="footer-note">Prepared for ${escapeHtml(content.lead_name)}</span>
  </div>
</div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function markdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[uo]l|<\/[uo]l|<li|<p|<\/p)(.+)$/gm, (line) =>
      line.trim() ? `<p>${line}</p>` : ''
    )
}
