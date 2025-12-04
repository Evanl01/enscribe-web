
import { z } from 'zod';
import { uuidRegex, isoDatetimeRegex } from '@/src/app/schemas/regex';

export const transcriptSchema = z.object({
  id: z.number().int().optional(), // int8 in SQL, optional for auto-increment
  created_at: z.string().regex(isoDatetimeRegex, 'Invalid ISO datetime').optional(),
  updated_at: z.string().regex(isoDatetimeRegex, 'Invalid ISO datetime').default(() => new Date().toISOString()).optional(),
  user_id: z.string().regex(uuidRegex, 'Invalid UUID').optional(),
  recording_id: z.number().int().optional(),
  encrypted_transcript_text: z.string().nullable(),
  iv: z.string().nullable().optional(),
});