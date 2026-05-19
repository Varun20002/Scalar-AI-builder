-- Persist the full PDFContent (hero_headline, intro_paragraph, closing_cta,
-- lead_name, etc.) so the edit/re-render path can reconstruct it without
-- relying on data that was previously discarded after generation.
alter table pdf_drafts
  add column if not exists content_json jsonb;
