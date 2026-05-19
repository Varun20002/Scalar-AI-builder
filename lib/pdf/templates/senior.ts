import { PDFContent } from '../../llm/prompts/pdfSections'

// Theme: senior IC persona — clean, minimal, no-fluff
// Palette: deep charcoal + electric blue accent, monospace accents

export function renderSeniorTemplate(content: PDFContent): string {
  const sectionsHTML = content.sections
    .map(
      (s) => `
    <div class="section ${s.section_type}">
      <div class="section-tag">${formatTag(s.section_type)}</div>
      <h2 class="section-heading">${escapeHtml(s.heading)}</h2>
      <div class="section-body">${markdownToHtml(s.body)}</div>
      ${s.kb_citations.length ? `<p class="citation">Grounded in: ${s.kb_citations.join(' · ')}</p>` : ''}
    </div>
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Scaler — ${escapeHtml(content.lead_name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #111827;
    color: #d1d5db;
    font-size: 14px;
    line-height: 1.7;
  }

  .page { max-width: 800px; margin: 0 auto; background: #111827; }

  /* Hero — minimal, text-first */
  .hero {
    padding: 56px 56px 44px;
    background: #0d1117;
    border-bottom: 2px solid #2563eb;
    position: relative;
  }
  .hero-eyebrow {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #2563eb;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .hero-headline {
    font-size: 30px;
    font-weight: 800;
    color: #f9fafb;
    line-height: 1.2;
    margin-bottom: 14px;
    letter-spacing: -0.8px;
    max-width: 600px;
  }
  .hero-subheadline {
    font-size: 15px;
    color: #6b7280;
    line-height: 1.6;
    max-width: 520px;
  }
  .top-right-badge {
    position: absolute;
    top: 56px; right: 56px;
    font-size: 10px;
    color: #374151;
    font-family: monospace;
    letter-spacing: 1px;
  }

  /* Intro */
  .intro {
    padding: 28px 56px;
    background: #161b22;
    border-bottom: 1px solid #1f2937;
  }
  .intro p { color: #9ca3af; line-height: 1.8; font-size: 14px; }

  /* Sections */
  .section {
    padding: 32px 56px;
    border-bottom: 1px solid #1f2937;
    background: #111827;
  }
  .section:nth-child(odd) { background: #0d1117; }

  .section-tag {
    font-family: monospace;
    font-size: 9px;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }
  .section-heading {
    font-size: 17px;
    font-weight: 700;
    color: #e5e7eb;
    margin-bottom: 14px;
    letter-spacing: -0.3px;
  }
  .section-heading::before {
    content: '→ ';
    color: #2563eb;
  }
  .section-body { color: #9ca3af; font-size: 13.5px; line-height: 1.85; }
  .section-body strong { color: #d1d5db; font-weight: 600; }
  .section-body ul { padding-left: 20px; margin: 8px 0; }
  .section-body li { margin-bottom: 5px; }
  .section-body p { margin-bottom: 10px; }
  
  .curriculum_detail .section-body {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px;
    background: #0d1117;
    border: 1px solid #1f2937;
    padding: 14px;
    border-radius: 4px;
    border-left: 3px solid #2563eb;
    color: #6ee7b7;
  }

  .citation {
    margin-top: 8px;
    font-size: 10px;
    color: #374151;
    font-family: monospace;
  }

  /* Social proof */
  .social_proof .section-body {
    border-left: 3px solid #2563eb;
    padding-left: 16px;
    font-style: italic;
    color: #6b7280;
  }

  /* CTA */
  .cta {
    padding: 40px 56px;
    background: #0d1117;
    border-top: 2px solid #2563eb;
  }
  .cta-headline {
    font-size: 20px;
    font-weight: 800;
    color: #f9fafb;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  .cta-sub {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 20px;
    font-family: monospace;
  }
  .cta-button {
    display: inline-block;
    background: #2563eb;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 12px 28px;
    border-radius: 3px;
    text-decoration: none;
    font-family: monospace;
  }

  /* Footer */
  .footer {
    padding: 18px 56px;
    background: #0a0f1a;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-brand {
    font-family: monospace;
    font-size: 10px;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .footer-note { font-size: 10px; color: #1f2937; }
</style>
</head>
<body>
<div class="page">
  <div class="hero">
    <div class="top-right-badge">// personal brief</div>
    <div class="hero-eyebrow">prepared for ${escapeHtml(content.lead_name)}</div>
    <h1 class="hero-headline">${escapeHtml(content.hero_headline)}</h1>
    <p class="hero-subheadline">${escapeHtml(content.hero_subheadline)}</p>
  </div>

  <div class="intro"><p>${markdownToHtml(content.intro_paragraph)}</p></div>

  ${sectionsHTML}

  <div class="cta">
    <p class="cta-headline">${escapeHtml(content.closing_cta)}</p>
    <p class="cta-sub">// next step: entrance test · 45 minutes</p>
    <span class="cta-button">Take the Entrance Test</span>
  </div>

  <div class="footer">
    <span class="footer-brand">Scaler Academy</span>
    <span class="footer-note">For ${escapeHtml(content.lead_name)}</span>
  </div>
</div>
</body>
</html>`
}

function formatTag(type: string): string {
  return type.replace(/_/g, ' ')
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
