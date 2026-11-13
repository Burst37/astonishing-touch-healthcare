import {z} from 'zod';
export const careEventNames=['care_planner_open','care_planner_complete','inquiry_saved','inquiry_failed','call_click','email_click','email_draft_open','booking_click','guide_open','voice_start','voice_connected','voice_error','voice_turn_complete'] as const;
// Never accept free text, contact information, URLs, queries or voice transcripts.
export const careEventSchema=z.object({event:z.enum(careEventNames),source:z.enum(['site','guide','planner','voice']),durationMs:z.number().int().min(0).max(120000).optional()}).strict();
export type CareEventName=typeof careEventNames[number];
export type CareEvent=z.infer<typeof careEventSchema>;
