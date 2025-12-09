// file: src/lib/models/player.ts

export interface BonusHistoryItem {
  timestamp: number;
  points: number;
  reason: string;
}

export interface Player {
  id: number;
  type: 'human' | 'computer' | 'ai';
  name: string;
  score: number;
  color: string;
  isComputer: boolean;
  penaltyPoints: number;
  bonusPoints: number;
  bonusHistory: BonusHistoryItem[];
  roundScore?: number;
}
