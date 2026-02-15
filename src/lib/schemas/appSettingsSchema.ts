import { z } from 'zod';

export const AppSettingsSchema = z.object({
    language: z.enum(['uk', 'en', 'crh', 'nl']).default('uk'),
    theme: z.enum(['light', 'dark']).default('dark'),
    style: z.enum(['purple', 'green', 'blue', 'gray', 'orange', 'wood']).default('gray')
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
