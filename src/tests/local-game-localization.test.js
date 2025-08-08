import { describe, it, expect } from 'vitest';
import ukLocalGame from '$lib/i18n/uk/localGame.js';
import enLocalGame from '$lib/i18n/en/localGame.js';
import nlLocalGame from '$lib/i18n/nl/localGame.js';
import crhLocalGame from '$lib/i18n/crh/localGame.js';

describe('Local Game Localization', () => {
  describe('Ukrainian translations', () => {
    it('повинен мати ключ gameStarted', () => {
      expect(ukLocalGame.gameStarted).toBeDefined();
      expect(typeof ukLocalGame.gameStarted).toBe('string');
      expect(ukLocalGame.gameStarted).toContain('Гра почалась!');
      expect(ukLocalGame.gameStarted).toContain('{playerName}');
    });

    it('повинен мати ключ playerMadeMove', () => {
      expect(ukLocalGame.playerMadeMove).toBeDefined();
      expect(typeof ukLocalGame.playerMadeMove).toBe('string');
      expect(ukLocalGame.playerMadeMove).toContain('зробив хід:');
      expect(ukLocalGame.playerMadeMove).toContain('{playerName}');
      expect(ukLocalGame.playerMadeMove).toContain('{nextPlayerName}');
      expect(ukLocalGame.playerMadeMove).toContain('{direction}');
      expect(ukLocalGame.playerMadeMove).toContain('{distance}');
    });
  });

  describe('English translations', () => {
    it('should have gameStarted key', () => {
      expect(enLocalGame.gameStarted).toBeDefined();
      expect(typeof enLocalGame.gameStarted).toBe('string');
      expect(enLocalGame.gameStarted).toContain('Game started!');
      expect(enLocalGame.gameStarted).toContain('{playerName}');
    });

    it('should have playerMadeMove key', () => {
      expect(enLocalGame.playerMadeMove).toBeDefined();
      expect(typeof enLocalGame.playerMadeMove).toBe('string');
      expect(enLocalGame.playerMadeMove).toContain('made a move:');
      expect(enLocalGame.playerMadeMove).toContain('{playerName}');
      expect(enLocalGame.playerMadeMove).toContain('{nextPlayerName}');
      expect(enLocalGame.playerMadeMove).toContain('{direction}');
      expect(enLocalGame.playerMadeMove).toContain('{distance}');
    });
  });

  describe('Dutch translations', () => {
    it('should have gameStarted key', () => {
      expect(nlLocalGame.gameStarted).toBeDefined();
      expect(typeof nlLocalGame.gameStarted).toBe('string');
      expect(nlLocalGame.gameStarted).toContain('Spel gestart!');
      expect(nlLocalGame.gameStarted).toContain('{playerName}');
    });

    it('should have playerMadeMove key', () => {
      expect(nlLocalGame.playerMadeMove).toBeDefined();
      expect(typeof nlLocalGame.playerMadeMove).toBe('string');
      expect(nlLocalGame.playerMadeMove).toContain('deed een zet:');
      expect(nlLocalGame.playerMadeMove).toContain('{playerName}');
      expect(nlLocalGame.playerMadeMove).toContain('{nextPlayerName}');
      expect(nlLocalGame.playerMadeMove).toContain('{direction}');
      expect(nlLocalGame.playerMadeMove).toContain('{distance}');
    });
  });

  describe('Crimean Tatar translations', () => {
    it('should have gameStarted key', () => {
      expect(crhLocalGame.gameStarted).toBeDefined();
      expect(typeof crhLocalGame.gameStarted).toBe('string');
      expect(crhLocalGame.gameStarted).toContain('Oyun başladı!');
      expect(crhLocalGame.gameStarted).toContain('{playerName}');
    });

    it('should have playerMadeMove key', () => {
      expect(crhLocalGame.playerMadeMove).toBeDefined();
      expect(typeof crhLocalGame.playerMadeMove).toBe('string');
      expect(crhLocalGame.playerMadeMove).toContain('areket yaptı:');
      expect(crhLocalGame.playerMadeMove).toContain('{playerName}');
      expect(crhLocalGame.playerMadeMove).toContain('{nextPlayerName}');
      expect(crhLocalGame.playerMadeMove).toContain('{direction}');
      expect(crhLocalGame.playerMadeMove).toContain('{distance}');
    });
  });

  describe('Consistency across languages', () => {
    it('всі мови повинні мати однаковий набір ключів', () => {
      const ukKeys = Object.keys(ukLocalGame);
      const enKeys = Object.keys(enLocalGame);
      const nlKeys = Object.keys(nlLocalGame);
      const crhKeys = Object.keys(crhLocalGame);

      expect(ukKeys).toEqual(enKeys);
      expect(ukKeys).toEqual(nlKeys);
      expect(ukKeys).toEqual(crhKeys);
    });

    it('всі мови повинні мати плейсхолдери в gameStarted', () => {
      expect(ukLocalGame.gameStarted).toContain('{playerName}');
      expect(enLocalGame.gameStarted).toContain('{playerName}');
      expect(nlLocalGame.gameStarted).toContain('{playerName}');
      expect(crhLocalGame.gameStarted).toContain('{playerName}');
    });

    it('всі мови повинні мати плейсхолдери в playerMadeMove', () => {
      const requiredPlaceholders = ['{playerName}', '{nextPlayerName}', '{direction}', '{distance}'];
      
      requiredPlaceholders.forEach(placeholder => {
        expect(ukLocalGame.playerMadeMove).toContain(placeholder);
        expect(enLocalGame.playerMadeMove).toContain(placeholder);
        expect(nlLocalGame.playerMadeMove).toContain(placeholder);
        expect(crhLocalGame.playerMadeMove).toContain(placeholder);
      });
    });
  });
}); 