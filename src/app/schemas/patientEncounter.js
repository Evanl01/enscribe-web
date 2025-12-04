import { z } from 'zod';
import { uuidRegex, isoDatetimeRegex } from '@/src/app/schemas/regex';

export const patientEncounterSchema = z.object({
  id: z.number().int().optional(), // bigint in SQL, optional for auto-increment
  created_at: z.string().regex(isoDatetimeRegex, 'Invalid ISO datetime').optional(),
  updated_at: z.string().regex(isoDatetimeRegex, 'Invalid ISO datetime').nullable().optional(),
  user_id: z.string().regex(uuidRegex, 'Invalid UUID').nullable().optional(),
  encrypted_name: z.string().nullable().optional(),
  recording_file_path: z.string().nullable().optional(),
  recording_file_signed_url: z.string().nullable().optional(),
  recording_file_signed_url_expiry: z.string().regex(isoDatetimeRegex, 'Invalid ISO datetime').nullable().optional(),
  encrypted_aes_key: z.string().nullable().optional(),
  iv: z.string().nullable().optional(),
});