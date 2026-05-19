import { PDFContent } from '../../llm/prompts/pdfSections'

// Theme: engineer persona — pragmatic, dark-accent, ROI-focused visual style
// Palette: deep indigo + amber accent

export function renderEngineerTemplate(content: PDFContent): string {
  const sectionsHTML = content.sections
    .map(
      (s) => `
    <div class="section ${s.section_type}">
      <h2 class="section-heading">${escapeHtml(s.heading)}</h2>
      <div class="section-body">${markdownToHtml(s.body)}</div>
      ${s.kb_citations.length ? `<p class="citation">Source: Scaler curriculum [${s.kb_citations.join(', ')}]</p>` : ''}
    </div>
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Scaler Path — ${escapeHtml(content.lead_name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f0f1a;
    color: #e2e8f0;
    font-size: 14px;
    line-height: 1.7;
  }

  .page {
    max-width: 800px;
    margin: 0 auto;
    background: #0f0f1a;
  }

  /* Hero */
  .hero {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
    padding: 48px 48px 40px;
    border-bottom: 3px solid #f59e0b;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    top: -50px; right: -50px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
  .hero-label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #f59e0b;
    font-weight: 600;
    margin-bottom: 16px;
  }
  .hero-headline {
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  .hero-subheadline {
    font-size: 15px;
    color: #a5b4fc;
    max-width: 560px;
    line-height: 1.6;
  }
  .scaler-badge {
    position: absolute;
    top: 48px; right: 48px;
    background: #f59e0b;
    color: #0f0f1a;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    padding: 6px 14px;
    border-radius: 2px;
    text-transform: uppercase;
  }

  /* Intro */
  .intro {
    padding: 32px 48px;
    background: #13131f;
    border-bottom: 1px solid #1e1b4b;
  }
  .intro p {
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.8;
  }

  /* Sections */
  .section {
    padding: 32px 48px;
    border-bottom: 1px solid #1a1a2e;
    position: relative;
  }
  .section:nth-child(even) { background: #11111d; }
  .section:nth-child(odd) { background: #0f0f1a; }

  .section-heading {
    font-size: 16px;
    font-weight: 700;
    color: #f59e0b;
    margin-bottom: 14px;
    padding-left: 12px;
    border-left: 3px solid #f59e0b;
    letter-spacing: -0.2px;
  }
  .section-body {
    color: #cbd5e1;
    font-size: 13.5px;
    line-height: 1.8;
  }
  .section-body strong { color: #e2e8f0; font-weight: 600; }
  .section-body ul { padding-left: 20px; margin-top: 8px; }
  .section-body li { margin-bottom: 6px; }
  .section-body p { margin-bottom: 10px; }
  .citation {
    margin-top: 10px;
    font-size: 10px;
    color: #475569;
    font-style: italic;
  }

  /* ROI table style */
  .roi_analysis .section-body {
    background: #1a1a2e;
    padding: 16px;
    border-radius: 4px;
    border-left: 3px solid #f59e0b;
  }

  /* CTA */
  .cta {
    padding: 40px 48px;
    background: linear-gradient(135deg, #1e1b4b, #0f172a);
    text-align: center;
  }
  .cta-text {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8px;
  }
  .cta-sub {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 24px;
  }
  .cta-button {
    display: inline-block;
    background: #f59e0b;
    color: #0f0f1a;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 14px 36px;
    border-radius: 3px;
    text-decoration: none;
  }

  /* Footer */
  .footer {
    padding: 20px 48px;
    background: #0a0a14;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #1e1b4b;
  }
  .footer-brand {
    font-size: 11px;
    color: #475569;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .footer-note {
    font-size: 10px;
    color: #334155;
  }
</style>
</head>
<body>
<div class="page">
  <div class="hero">
    <div class="scaler-badge">Scaler</div>
    <div class="hero-label">Prepared for you · ${escapeHtml(content.lead_name)}</div>
    <h1 class="hero-headline">${escapeHtml(content.hero_headline)}</h1>
    <p class="hero-subheadline">${escapeHtml(content.hero_subheadline)}</p>
  </div>

  <div class="intro">
    <p>${markdownToHtml(content.intro_paragraph)}</p>
  </div>

  ${sectionsHTML}

  <div class="cta">
    <p class="cta-text">${escapeHtml(content.closing_cta)}</p>
    <p class="cta-sub">The entrance test is your next step. It takes 45 minutes.</p>
    <span class="cta-button">Take the Entrance Test</span>
  </div>

  <div class="footer">
    <span class="footer-brand">Scaler Academy</span>
    <span class="footer-note">Prepared specifically for ${escapeHtml(content.lead_name)}</span>
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
