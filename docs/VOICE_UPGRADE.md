# Ask Brittany answer and voice setup

Keep the selected ElevenLabs voice as Brittany's production voice. Gemini 3.8 Flash generates her answers. Put secrets in the hosting provider's server-side environment, never in the browser or source archive:

```text
GEMINI_API_KEY=<server-side Gemini API key>
CARE_AI_PROVIDER=gemini
CARE_AI_MODEL=gemini-3.8-flash
SPEECH_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=<server-side ElevenLabs API key>
ELEVENLABS_VOICE_ID=<the selected Brittany voice ID>
```

With a Gemini key, the site selects direct Gemini text answers. The assistant requests low thinking for quicker responses. `SPEECH_PROVIDER=elevenlabs` keeps the chosen Brittany voice, regardless of the Gemini answer model. Gemini 3.8 TTS is available as an alternate voice provider only when ElevenLabs is deliberately not selected. Set `CARE_AI_PROVIDER=openai` only if you intentionally want to retain the former text-answer provider.

The voice model only turns completed answer text into speech. The browser currently waits for the entire assistant response before requesting the first speech segment, so the change to 3.8 TTS alone cannot remove all of the pause. Low thinking and shorter outputs can reduce the first stage. Further latency reduction requires streaming the answer and synthesizing its first sentence as it arrives, or a Live API conversation implementation. Measure each stage on the deployed host before promising a response time.

Production check: ask a normal question with voice enabled and confirm the `/api/assistant` response says `mode: ai`; then confirm `/api/speech` returns `audio/wav` and plays. Test microphone permission and a second conversational turn on mobile. If answers say `mode: guide`, the AI provider failed or is not configured.

This archive still needs the platform conversion described in `VERCEL-HANDOFF.md` before a Vercel deployment. The changes here have not been deployed.
