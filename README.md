# Scaler BDA Agent

## What I Built

This is an AI assistant for BDAs (Business Development Associates) at Scaler. It helps in two key ways:

1. **Pre-call context** — Before a call, it gives the BDA relevant context about the lead (who they are, what angles to open with, likely objections) so they can open the conversation confidently.
2. **Post-call PDF** — After the call, it listens to the transcript, extracts every question the lead asked, retrieves grounded answers from Scaler's knowledge base, and generates a personalised PDF that answers those questions in detail — giving the lead confidence to take up the entrance test.

The PDF is sent to the lead's WhatsApp only after the BDA reviews and approves it.

## One Failure I Found

There were many bugs — PDF not generating due to Puppeteer type mismatches on Vercel, Twilio sandbox not connecting for new users, and the edit/save flow crashing because the DB didn't persist the full content needed for re-rendering.

For each one, I used the same structured debugging approach:
1. Generate hypotheses about the root cause.
2. Add targeted logs to confirm or reject each hypothesis with runtime evidence.
3. Once confirmed, double down on the proven cause and resolve it structurally (schema changes, proper data persistence, correct API response shapes) rather than patching symptoms.

## Scale Plan

If leads scale to 100,000 per month:

- **Database** — The current Supabase free tier won't hold. Would need to upgrade to a Pro plan or move to a dedicated Postgres instance with proper connection pooling (PgBouncer) and partitioned tables.
- **LLM** — MiniMax (or any LLM provider) can't handle that volume on a single API key without running out of credits or hitting rate limits. Fix: add request queuing, batch leads of the same persona type to share prompt prefixes, cache faithfulness-checked sections keyed on (question_hash + KB_version), and set up budget alerts with automatic fallback to a cheaper model for non-critical steps.
- **PDF rendering** — Puppeteer on serverless will time out at volume. Move to an async worker queue (dedicated container on Fly.io or Render) so the API returns immediately and the PDF is rendered in the background.
