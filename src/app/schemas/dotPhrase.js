import { z } from 'zod';
import { uuidRegex, isoDatetimeRegex } from '@/src/app/schemas/regex';

export const dotPhraseSchema = z.object({
  id: z.number().int().optional(), // bigint in SQL, optional for auto-increment
  created_at: z.string().regex(isoDatetimeRegex, 'Invalid ISO datetime').optional(),
  updated_at: z.string().regex(isoDatetimeRegex, 'Invalid ISO datetime').nullable().optional(),
  user_id: z.string().regex(uuidRegex, 'Invalid UUID').nullable().optional(),
  encrypted_trigger: z.string().nullable().optional(),
  encrypted_expansion: z.string().nullable().optional(),
  encrypted_aes_key: z.string().nullable().optional(),
  iv: z.string().nullable().optional(),
});