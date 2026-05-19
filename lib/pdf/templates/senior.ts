import { PDFContent } from '../../llm/prompts/pdfSections'

// Warm Cream Editorial — Senior persona
// Persona tint: slate-blue (#5B7A8A at 10%) on curriculum_detail sections

export function renderSeniorTemplate(content: PDFContent): string {
  const sectionsHTML = content.sections
    .map(
      (s) => `
    <div class="section ${s.section_type}">
      <div class="section-type-label">${formatTag(s.section_type)}</div>
      <h2 class="section-heading">${escapeHtml(s.heading)}</h2>
      <div class="section-body">${markdownToHtml(s.body)}</div>
      ${s.kb_citations.length ? `<p class="citation">Grounded in: ${s.kb_citations.join(' &middot; ')}</p>` : ''}
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --cream: #EAE4D8;
    --warm-white: #F5F3EC;
    --ink: #262019;
    --body: #574E44;
    --muted: #6B6357;
    --terracotta: #BC5A2E;
    --terracotta-dark: #8A3D1C;
    --dark-band: #17120D;
    --persona-tint: rgba(91, 122, 138, 0.09);
    --persona-border: #5B7A8A;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    background: var(--cream);
    color: var(--body);
    font-size: 14px;
    line-height: 1.65;
  }

  .page {
    max-width: 800px;
    margin: 0 auto;
    background: var(--cream);
  }

  /* ── Hero ── */
  .hero {
    padding: 52px 52px 44px;
    background: var(--cream);
    border-bottom: 1.5px solid rgba(38,32,25,0.12);
    position: relative;
  }

  .hero-label {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--terracotta-dark);
    font-weight: 600;
    margin-bottom: 20px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .hero-headline {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 32px;
    font-weight: 900;
    color: var(--ink);
    line-height: 1.2;
    margin-bottom: 14px;
    letter-spacing: -0.025em;
    max-width: 620px;
  }

  .hero-headline em {
    font-style: italic;
    color: var(--terracotta);
  }

  .hero-subheadline {
    font-size: 15px;
    color: var(--muted);
    max-width: 540px;
    line-height: 1.7;
  }

  .scaler-badge {
    position: absolute;
    top: 52px;
    right: 52px;
    font-family: 'Fraunces', Georgia, serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--terracotta-dark);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  /* ── Intro ── */
  .intro {
    padding: 28px 52px;
    background: var(--warm-white);
    border-bottom: 1.5px solid rgba(38,32,25,0.08);
    box-shadow: inset 0 -1px 0 rgba(38,32,25,0.04);
  }

  .intro p {
    color: var(--body);
    font-size: 14.5px;
    line-height: 1.75;
    max-width: 65ch;
  }

  /* ── Sections ── */
  .section {
    padding: 32px 52px;
    border-bottom: 1.5px solid rgba(38,32,25,0.07);
    position: relative;
  }

  .section:nth-child(odd) { background: var(--cream); }
  .section:nth-child(even) { background: var(--warm-white); }

  .section-type-label {
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .section-heading {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 19px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 14px;
    letter-spacing: -0.02em;
    line-height: 1.3;
  }

  .section-body {
    color: var(--body);
    font-size: 14px;
    line-height: 1.75;
  }

  .section-body p { margin-bottom: 10px; max-width: 65ch; }
  .section-body strong { color: var(--ink); font-weight: 600; }
  .section-body em { font-style: italic; color: var(--terracotta); }
  .section-body ul { padding-left: 20px; margin: 8px 0; }
  .section-body li { margin-bottom: 6px; color: var(--body); }

  /* persona tint — slate-blue on curriculum_detail */
  .curriculum_detail .section-body {
    background: var(--persona-tint);
    padding: 16px 18px;
    border-radius: 6px;
    border-left: 3px solid var(--persona-border);
  }

  /* social proof — restrained blockquote */
  .social_proof .section-body {
    border-left: 3px solid rgba(38,32,25,0.15);
    padding-left: 16px;
  }

  .citation {
    margin-top: 12px;
    font-size: 10px;
    color: var(--muted);
    font-style: italic;
  }

  /* ── CTA — dark band ── */
  .cta {
    padding: 48px 52px;
    background: var(--dark-band);
    text-align: center;
  }

  .cta-headline {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 22px;
    font-weight: 900;
    color: #F5F3EC;
    margin-bottom: 10px;
    letter-spacing: -0.025em;
    line-height: 1.3;
  }

  .cta-sub {
    font-size: 13px;
    color: rgba(245,243,236,0.55);
    margin-bottom: 28px;
    line-height: 1.6;
  }

  /* cartoon button */
  .cta-button {
    display: inline-block;
    background: var(--terracotta);
    color: #F5F3EC;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 13px 32px;
    border-radius: 100px;
    text-decoration: none;
    border: 2.5px solid #F5F3EC;
    box-shadow: 0 5px 0 rgba(245,243,236,0.25);
  }

  /* ── Footer — dark band ── */
  .footer {
    padding: 32px 52px;
    background: var(--dark-band);
    border-top: 1px solid rgba(245,243,236,0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-brand {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(245,243,236,0.9);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .footer-note {
    font-size: 10px;
    color: rgba(245,243,236,0.35);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="page">

  <div class="hero">
    <div class="scaler-badge">Scaler</div>
    <div class="hero-label">Prepared for you &middot; ${escapeHtml(content.lead_name)}</div>
    <h1 class="hero-headline">${escapeHtml(content.hero_headline)}</h1>
    <p class="hero-subheadline">${escapeHtml(content.hero_subheadline)}</p>
  </div>

  <div class="intro">
    <p>${markdownToHtml(content.intro_paragraph)}</p>
  </div>

  ${sectionsHTML}

  <div class="cta">
    <p class="cta-headline">${escapeHtml(content.closing_cta)}</p>
    <p class="cta-sub">45 minutes. No prep needed. Just signal your intent.</p>
    <a class="cta-button" href="https://wa.me/${(content.bda_phone ?? '').replace('+', '')}?text=${encodeURIComponent("Hi, I'm ready to take the Scaler entrance test!")}" target="_blank">Take the Entrance Test &rarr;</a>
  </div>

  <div class="footer">
    <span class="footer-brand">Scaler</span>
    <span class="footer-note">Prepared for ${escapeHtml(content.lead_name)}</span>
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
