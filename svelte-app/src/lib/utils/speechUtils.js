import { logStore } from '$lib/stores/logStore.js';

let isUnlocked = false;

/**
 * Спроба "розблокувати" Web Speech API на iOS, викликавши тихе, порожнє висловлювання
 * у відповідь на першу дію користувача.
 */
export function unlockSpeechSynthesis() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || isUnlocked) {
    return;
  }

  logStore.addLog('[Speech] Attempting to unlock speech synthesis for iOS...', 'debug');
  
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0; // Робимо його абсолютно тихим
  utterance.rate = 2; // Прискорюємо, щоб він завершився миттєво

  window.speechSynthesis.speak(utterance);
  
  // Перевіряємо, чи почалося відтворення. На iOS `speaking` може не оновитися миттєво.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    isUnlocked = true;
    logStore.addLog('[Speech] Synthesis unlocked successfully.', 'info');
  } else {
    // Іноді потрібно другий виклик
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.speaking) {
            isUnlocked = true;
            logStore.addLog('[Speech] Synthesis unlocked on second attempt.', 'info');
        } else {
            logStore.addLog('[Speech] Failed to unlock speech synthesis.', 'warn');
        }
    }, 50);
  }
} 