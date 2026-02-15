// file: src/lib/models/moveHistory.ts

export interface MoveHistoryEntry {
  pos: { row: number, col: number };
  blocked: { row: number, col: number }[];
  visits?: Record<string, number>;
  blockModeEnabled?: boolean;
}
