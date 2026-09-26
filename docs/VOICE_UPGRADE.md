# Ask Brittany voice setup

The source defaults to Gemini 3.8 Flash TTS using the Interactions API. Put secrets in the hosting provider's server-side environment, never in the browser or source archive:

```text
GEMINI_API_KEY=<server-side Gemini API key>
CARE_AI_PROVIDER=gemini
CARE_AI_MODEL=gemini-3.8-flash
GEMINI_TTS_MODEL=gemini-3.8-flash-tts
GEMINI_TTS_VOICE=Sulafat
```

With a Gemini key, the site selects direct Gemini text answers and Gemini 3.8 TTS even if older completion or ElevenLabs settings remain. The assistant requests low thinking for quicker responses. Set `CARE_AI_PROVIDER=openai` only if you intentionally want to retain the former text-answer provider. If Gemini is unavailable and `SPEECH_PROVIDER=elevenlabs`, the existing ElevenLabs speech route remains the fallback.

The voice model only turns completed answer text into speech. The browser currently waits for the entire assistant response before requesting the first speech segment, so the change to 3.8 TTS alone cannot remove all of the pause. Low thinking and shorter outputs can reduce the first stage. Further latency reduction requires streaming the answer and synthesizing its first sentence as it arrives, or a Live API conversation implementation. Measure each stage on the deployed host before promising a response time.

Production check: ask a normal question with voice enabled and confirm the `/api/assistant` response says `mode: ai`; then confirm `/api/speech` returns `audio/wav` and plays. Test microphone permission and a second conversational turn on mobile. If answers say `mode: guide`, the AI provider failed or is not configured.

This archive still needs the platform conversion described in `VERCEL-HANDOFF.md` before a Vercel deployment. The changes here have not been deployed.
