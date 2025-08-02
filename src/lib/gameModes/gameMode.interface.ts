// Інтерфейс для ігрового режиму (розширюваний для локальної та онлайн гри)
export interface IGameMode {
  /** Унікальний ідентифікатор режиму */
  id: string;
  /** Людське ім'я режиму */
  label: string;
  /** Чи підтримує режим онлайн-гру */
  isOnline: boolean;
  /** Ініціалізація режиму (підключення, підготовка, тощо) */
  init(): Promise<void> | void;
  /** Завершення режиму (відключення, очищення ресурсів) */
  dispose(): Promise<void> | void;
  /** Обробка ходу гравця */
  handlePlayerMove(move: any): Promise<void> | void;
  /** Обробка ходу супротивника (або іншого гравця) */
  handleOpponentMove(move: any): Promise<void> | void;
  /** Синхронізація стану (для онлайн-режиму) */
  syncState?(state: any): Promise<void> | void;
} 