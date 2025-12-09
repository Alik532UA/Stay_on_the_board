// file: src/lib/models/player.ts

export interface Player {
  id: number;
  type: any;
  name: string;
  score: number;
  color: string;
  isComputer: boolean;
  penaltyPoints: number;
  bonusPoints: number;
  bonusHistory: any[];
  roundScore?: number;
}