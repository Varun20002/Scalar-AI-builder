-- Scaler BDA Agent — initial schema
-- Run in Supabase SQL Editor

-- Leads table
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profile_json jsonb not null default '{}',
  bda_phone text,
  lead_phone text,
  stage text not null default 'pre_call' check (stage in ('pre_call', 'post_call')),
  source_channel text default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transcripts table
create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  source text not null check (source in ('text', 'audio')),
  text text not null,
  audio_url text,
  created_at timestamptz not null default now()
);

-- Nudges (BDA-facing, no approval)
create table if not exists nudges (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  content_md text not null,
  structured_json jsonb,
  message_sid text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- PDF drafts
create table if not exists pdf_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  sections_json jsonb not null default '[]',
  cover_message text,
  html text,
  pdf_url text,
  persona_type text default 'engineer',
  status text not null default 'pending' check (status in ('pending', 'approved', 'edited', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sends log
create table if not exists sends (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references pdf_drafts(id) on delete cascade,
  nudge_id uuid references nudges(id) on delete cascade,
  channel text not null default 'whatsapp',
  to_number text not null,
  message_sid text,
  status text not null default 'sent',
  sent_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

create trigger pdf_drafts_updated_at
  before update on pdf_drafts
  for each row execute function set_updated_at();

-- Indexes
create index if not exists idx_leads_stage on leads(stage);
create index if not exists idx_transcripts_lead_id on transcripts(lead_id);
create index if not exists idx_nudges_lead_id on nudges(lead_id);
create index if not exists idx_pdf_drafts_lead_id on pdf_drafts(lead_id);
create index if not exists idx_pdf_drafts_status on pdf_drafts(status);
