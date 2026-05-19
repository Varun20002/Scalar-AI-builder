# Deployment Guide

## Option A: Vercel CLI (fastest, ~3 min)

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy (first time sets up project)
npx vercel --yes

# 3. Add environment variables (replace with your values)
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add MINIMAX_API_KEY production
npx vercel env add MINIMAX_GROUP_ID production
npx vercel env add DEEPGRAM_API_KEY production
npx vercel env add TWILIO_ACCOUNT_SID production
npx vercel env add TWILIO_AUTH_TOKEN production
npx vercel env add TWILIO_WHATSAPP_FROM production
npx vercel env add TWILIO_SANDBOX_CODE production
npx vercel env add NEXT_PUBLIC_APP_URL production

# 4. Redeploy with env vars
npx vercel --prod
```

## Option B: GitHub + Vercel Dashboard (~5 min)

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import from GitHub
3. Add all env vars from `.env.example` in the Vercel dashboard
4. Deploy

## Required env vars

| Variable | Where to get it |
|----------|----------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project → Settings → API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase project → Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Supabase project → Settings → API (service_role) |
| MINIMAX_API_KEY | platform.minimaxi.chat → API Keys |
| MINIMAX_GROUP_ID | platform.minimaxi.chat → account settings |
| DEEPGRAM_API_KEY | console.deepgram.com → API Keys |
| TWILIO_ACCOUNT_SID | console.twilio.com → Account Info |
| TWILIO_AUTH_TOKEN | console.twilio.com → Account Info |
| TWILIO_WHATSAPP_FROM | `whatsapp:+14155238886` (Twilio sandbox number) |
| TWILIO_SANDBOX_CODE | console.twilio.com → Messaging → Try it out → WhatsApp |
| NEXT_PUBLIC_APP_URL | Your Vercel deployment URL |

## After deployment

1. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL and redeploy
2. Test the flow: open the app, join the Twilio sandbox from your phone, create a test lead
3. Verify WhatsApp delivery for nudge and PDF

## Twilio Sandbox setup (2 min)

1. Go to console.twilio.com → Messaging → Try it out → Send a WhatsApp message
2. Follow instructions to join the sandbox from your phone (send the join code to the Twilio number)
3. Copy the sandbox join code — add it as `TWILIO_SANDBOX_CODE` in Vercel
4. The sandbox number is always `+14155238886`
