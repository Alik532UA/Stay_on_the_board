import { logStore } from '$lib/stores/logStore.js';

let isUnlocked = false;

/**
 * Спроба "розблокувати" Web Speech API, викликавши тихе, порожнє висловлювання
 * у відповідь на першу дію користувача. Це необхідно для браузерів,
 * які "ледаче" завантажують голоси (напр., Edge, iOS).
 */
export function unlockSpeechSynthesis() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || isUnlocked) {
    return;
  }

  logStore.addLog('[Speech] Attempting to unlock speech synthesis...', 'debug');
  
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0; // Робимо його абсолютно тихим
  utterance.rate = 2;   // Прискорюємо, щоб він завершився миттєво

  window.speechSynthesis.speak(utterance);
  
  // Перевіряємо, чи почалося відтворення.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    isUnlocked = true;
    logStore.addLog('[Speech] Synthesis unlocked successfully.', 'info');
  } else {
    // Іноді потрібен другий виклик з невеликою затримкою
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