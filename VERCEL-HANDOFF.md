# Astonishing Touch — Vercel deployment

This project is a Next.js 16 app. `npm install` followed by `npm run build` completed successfully on September 25, 2026 with Node 24. The Cloudflare worker, Vite plugin, and unused D1 adapter remain in the source as historical tooling; `tsconfig.json` excludes them from the Vercel build. The active inquiry route uses a webhook and does not call D1.

## Deploy

1. Import `Burst37/astonishing-touch-healthcare` into Vercel as a Next.js project. Use the repository root and Node 22 or later. Run `npm install` when the repository has no lockfile.
2. Configure server-only environment variables for every production and preview environment that needs them:

   - `GEMINI_API_KEY`: required for direct Gemini answers.
   - `CARE_AI_PROVIDER=gemini`, `CARE_AI_MODEL=gemini-3.8-flash`: selects fast direct Gemini answers.
   - `SPEECH_PROVIDER=elevenlabs`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`: preserve Brittany's selected ElevenLabs voice.
   - `GEMINI_TTS_MODEL=gemini-3.8-flash-tts`: optional alternate speech provider, only when ElevenLabs is not selected.
   - `INQUIRY_WEBHOOK_URL`: required HTTPS endpoint that securely receives and stores the validated inquiry payload. Without it, the form returns 503 and prompts the visitor to call.
   - `BOOKING_URL`: optional actual scheduler URL. Never present scheduling as confirmed without an integration.

   Do not set API keys in `NEXT_PUBLIC_` variables or commit secrets. The webhook receives name, phone, optional email, selected service, consent, reference, and creation time. Confirm that its owner can access and act on those messages.
3. Deploy a preview. Test homepage videos on desktop/mobile, assistant response (`mode: ai`), speech playback, and an inquiry end to end with consent. Verify the submitted inquiry reached its destination; a 201 response alone is not the whole check.
4. Point the public domain and enable indexing in `app/search-config.ts` only after owner approval and full launch checks. The project currently declares `publicIndexing=false`.

The previously documented D1 migration is not required for the current webhook based form. The `/inquiries` page is informational and not an owner inbox on Vercel.
