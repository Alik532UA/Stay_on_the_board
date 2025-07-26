// src/lib/services/audioService.js
import { base } from '$app/paths';

/** @type {HTMLAudioElement|null} */
let audioInstance = null;

/**
 * Ініціалізує аудіо-плеєр, якщо він ще не створений.
 * Гарантує, що існує лише один екземпляр на всю програму.
 * @returns {HTMLAudioElement|null}
 */
const getAudio = () => {
  // Працюємо тільки на клієнті
  if (typeof window === 'undefined') {
    return null;
  }
  if (!audioInstance) {
    audioInstance = new Audio(`${base}/dont-push-the-horses.weba`);
    audioInstance.loop = true; // Музика буде повторюватись
  }
  return audioInstance;
};

export const audioService = {
  /**
   * Починає відтворення музики.
   */
  play() {
    const audio = getAudio();
    if (audio && audio.paused) {
      // Завжди починаємо спочатку при виклику play
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
  },

  /**
   * Зупиняє відтворення музики.
   */
  pause() {
    const audio = getAudio();
    if (audio && !audio.paused) {
      audio.pause();
    }
  },

  /**
   * Встановлює гучність.
   * @param {number} volume - Гучність від 0.0 до 1.0
   */
  setVolume(volume) {
    const audio = getAudio();
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  },

  /**
   * Завантажує збережену гучність з localStorage.
   * @returns {number}
   */
  loadVolume() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expertModeVolume');
      // Змінено: гучність за замовчуванням тепер 30%
      return saved !== null ? parseFloat(saved) : 0.3;
    }
    return 0.3;
  },

  /**
   * Зберігає гучність в localStorage.
   * @param {number} volume
   */
  saveVolume(volume) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('expertModeVolume', String(volume));
    }
  }
}; 