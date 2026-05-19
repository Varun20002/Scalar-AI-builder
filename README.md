# Scaler BDA Agent

## What you built

A Next.js 15 app (deployed on Vercel) that supercharges Scaler BDAs at two moments in the sales funnel. Before the call: the agent generates a short, scannable WhatsApp brief for the BDA — who the lead is, two or three angles to open with, expected objections and one-line handles, a specific opening hook — and sends it directly to the BDA's phone with no approval gate. After the call: the BDA adds a transcript (text) or uploads a call recording (transcribed by Deepgram Nova-3), the agent extracts every open question from the call, retrieves grounded answers from a pre-scraped Scaler KB, composes a 2–3 page personalised PDF (each persona gets a visually distinct HTML/CSS theme — dark-indigo for mid-career engineers, charcoal-blue monospace for senior ICs, warm-cream-green for students), runs a faithfulness judge pass to catch any ungrounded curriculum claims and rewrite them to "we'll confirm on the follow-up", then queues the PDF for BDA review. The BDA previews the PDF and cover message inline, edits any section or regenerates it with a free-text note, and clicks Approve to deliver the PDF and personalised WhatsApp message to the lead. Nothing reaches the lead without BDA sign-off. Built with MiniMax (LLM), Deepgram (STT), Twilio WhatsApp Sandbox, Supabase Postgres + Storage, and Puppeteer for PDF rendering.

## One failure

When the lead's profile has no LinkedIn data and the transcript contains no explicit questions (just vague positive sentiment), the question extractor invents a "placement guarantee" concern not present in the call. The extractor's system prompt instructs it to only extract questions actually stated, but vague sentiment without anchors causes it to hallucinate the most statistically common Scaler objection rather than returning an empty array. Fix: add a hard schema assertion that `raw_quote` must match a substring of the transcript; reject any question without a real quote.

## Scale plan

At 100,000 leads a month, two things break first. (1) Puppeteer PDF rendering on Vercel serverless: cold-start latency plus the 10s max execution limit will cause timeouts at volume. Fix: move PDF rendering to a dedicated async worker (Fly.io or Render) triggered via a Supabase Edge Function queue, with the Vercel route returning a job ID immediately and polling for completion. (2) MiniMax API rate limits: at five sequential LLM calls per lead (extract, compose, faithfulness, cover, nudge), 100K leads/month means ~500K model calls. Fix: parallelise the extract and KB retrieval steps, cache faithfulness-checked section drafts keyed on (question_hash + KB_version), and batch leads of the same persona cluster into shared prompt prefixes to reduce token overhead.

---

## Setup

### 1. Clone and install
```bash
git clone <repo>
cd scaler-bda-agent
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=     # from Supabase dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

MINIMAX_API_KEY=              # from MiniMax platform
MINIMAX_GROUP_ID=             # your MiniMax group ID

DEEPGRAM_API_KEY=             # from Deepgram console

TWILIO_ACCOUNT_SID=           # from Twilio console
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SANDBOX_CODE=join your-code   # from Twilio Sandbox settings

NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Database
The schema is auto-applied to Supabase on first deploy. To apply manually, run `db/migrations/001_initial.sql` in the Supabase SQL editor.

### 4. Run locally
```bash
npm run dev
```

Open http://localhost:3000. Enter your phone number (after joining the Twilio sandbox), then create a lead.

### 5. Evals
```bash
npm run eval          # Promptfoo tests on nudge + extraction
npm run eval:judge    # LLM-as-judge faithfulness + personalization
```

---

## Architecture

```
Onboarding (BDA phone) → Dashboard (create lead)
→ Lead page:
   ├── Stage A (pre-call): Generate nudge → WhatsApp to BDA (no approval)
   └── Stage B (post-call):
       ├── Text transcript OR
       ├── Audio upload → Deepgram transcription
       └── Generate PDF:
           MiniMax: extract questions
           KB: retrieve grounded snippets
           MiniMax: compose sections (persona-tuned)
           MiniMax: faithfulness judge pass
           MiniMax: cover message
           Puppeteer: HTML → PDF
           Supabase Storage: upload
           → /approval/[id]: Preview + Approve/Edit/Skip → Twilio → Lead's WhatsApp
```

## Three submission questions

1. What is the current pickup rate, and what is the gap between "pickup rate" and "call lasting 60+ seconds"? This tells us whether the pre-call nudge should optimise for the lead answering at all (first 3 seconds) or for the BDA holding the conversation (first 60 seconds) — two different nudge designs.

2. Of leads who had a good call but never took the entrance test, what reasons do BDAs hear most when they follow up — trust in the program, time cost, money anxiety, or fear of failing the test? The PDF needs to weight its sections toward the dominant blocker, not give equal space to all four.

3. How much of a BDA's working time today goes to pre-call prep, the call itself, and post-call follow-up? If prep is already minimal, the nudge saves less time than it appears. If follow-up is where hours disappear, the PDF automation is the bigger unlock and we should invest there first.
