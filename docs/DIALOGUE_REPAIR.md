# Brittany dialogue repair — November 12, 2026

Reported failure: the visitor speaks but receives no spoken reply.

## Evidence and limits

The previous Python probe supplied an explicit end-of-audio signal. A second probe that streamed speech followed by ordinary silence also received correct replies on both turns (769ms and 546ms to first audio). That confirms server automatic pause detection works with those synthetic inputs; it does not prove phone capture or playback works.

A preview-only browser regression page then sent two fixed spoken questions through the actual browser audio graph, capture worklet, Live WebSocket and PCM playback scheduler. It observed 948 captured packets, 44 scheduled reply chunks, correct user/assistant transcripts for both turns and a running output context. It used a synthetic MediaStream, not the user's physical microphone.

Source review found that the portrait only opened the text panel. Voice required a second separate Talk to Brittany click. A new regression test also reproduced audio remaining suspended when microphone acquisition changed the output context state. This is a reproducible lifecycle defect, not proof that it was the only cause on the owner's phone.

## Changes

- Clicking the portrait now unlocks audio immediately and requests a voice start when the panel opens. The browser still requires microphone permission. Ordinary page loads and text-only entry points do not start a microphone.
- A fresh live conversation requests a spoken greeting. Existing typed context remains available when switching to voice.
- Capture and reply playback share the same gesture-unlocked AudioContext. It is resumed again after microphone acquisition, and before scheduling PCM replies if suspended later.
- Queued audio is serialized and tagged with an interruption epoch, preventing late reply chunks from playing after interruption or close.
- Ending a live session stops capture and releases its graph without closing the reusable output context. Component unmount still closes that context.
- An authenticated session receiving no capture packets now produces a specific microphone error instead of silently appearing connected.
- Device microphone mute/unmute events update the visible status. Playback resumption failure produces a clear audio error.
- The voice disclosure and privacy text now describe the portrait as a voice-start control.

## Verification

Production build, TypeScript and 34 automated tests passed before hosted browser verification. New regressions cover suspended output after microphone permission, resumed PCM playback, stale queued audio on interruption, missing capture packets and the initial greeting.

The preview-only `/voice-lab` route is blocked with not-found when VERCEL_ENV is production. It uses only fixed synthetic utterances and the same CareLiveVoice implementation. The updated lab simulates a paused reply context during input acquisition, then checks a spoken greeting and two questions separated by natural pauses. It does not access a physical microphone or use production visitor recordings.

Do not equate any of these checks with certification of the owner's actual phone microphone, selected audio route or acoustic speaker output. The final phone retry remains the acceptance check for the reported device-specific failure.
