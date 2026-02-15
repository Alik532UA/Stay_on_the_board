import { z } from 'zod';
import { GameModePresetSchema } from './gameSettingsSchema';

export const GameParamsSchema = z.object({
    mode: GameModePresetSchema.optional(),
    roomId: z.string().optional(),
    playerId: z.string().optional()
});

export type GameParams = z.infer<typeof GameParamsSchema>;
