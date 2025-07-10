// === МОВНА ПІДТРИМКА ДЛЯ ОЗВУЧУВАННЯ ===

// Перевіряємо підтримку Web Speech API
const isSpeechSupported = 'speechSynthesis' in window;

// Налаштування мови для кожного стилю
const speechSettings = {
    uk: {
        voice: null,
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8
    },
    en: {
        voice: null,
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8
    },
    crh: {
        voice: null,
        rate: 0.8,
        pitch: 1.0,
        volume: 0.8
    },
    nl: {
        voice: null,
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8
    }
};

// Функція для отримання списку доступних голосів
function getAvailableVoices() {
    if (!isSpeechSupported) return [];
    
    const voices = speechSynthesis.getVoices();
    return voices.map(voice => ({
        name: voice.name,
        lang: voice.lang,
        default: voice.default,
        localService: voice.localService
    }));
}

// Функція для отримання голосів для конкретної мови
function getVoicesForLanguage(lang) {
    if (!isSpeechSupported) return [];
    
    const voices = speechSynthesis.getVoices();
    if (lang === 'crh') {
        // Кримськотатарська — шукаємо турецькі голоси
        return voices.filter(v => v.lang && v.lang.startsWith('tr'));
    }
    if (lang === 'nl') {
        // Нідерландська — шукаємо nl голоси
        return voices.filter(v => v.lang && v.lang.startsWith('nl'));
    }
    return voices.filter(v => v.lang && v.lang.startsWith(lang));
}

// Функція для встановлення конкретного голосу для мови
function setVoiceForLanguage(lang, voiceName) {
    if (!isSpeechSupported) return false;
    
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    
    if (voice && speechSettings[lang]) {
        speechSettings[lang].voice = voice;
        // Зберігаємо вибір в localStorage
        localStorage.setItem(`speech_voice_${lang}`, voiceName);
        return true;
    }
    return false;
}

// Функція для отримання тексту ходу на різних мовах
function getMoveText(direction, distance, lang = 'uk') {
    const directionTexts = {
        uk: {
            '1': "вниз-ліворуч", '2': "вниз", '3': "вниз-праворуч",
            '4': "ліворуч", '6': "праворуч",
            '7': "вгору-ліворуч", '8': "вгору", '9': "вгору-праворуч"
        },
        en: {
            '1': "down-left", '2': "down", '3': "down-right",
            '4': "left", '6': "right",
            '7': "up-left", '8': "up", '9': "up-right"
        },
        crh: {
            '1': "aşağı-sol", '2': "aşağı", '3': "aşağı-sağ",
            '4': "sol", '6': "sağ",
            '7': "yukarı-sol", '8': "yukarı", '9': "yukarı-sağ"
        },
        nl: {
            '1': "omlaag-links", '2': "omlaag", '3': "omlaag-rechts",
            '4': "links", '6': "rechts",
            '7': "omhoog-links", '8': "omhoog", '9': "omhoog-rechts"
        }
    };

    const numberTexts = {
        uk: {
            '1': 'один', '2': 'два', '3': 'три', '4': 'чотири', '5': 'п\'ять',
            '6': 'шість', '7': 'сім', '8': 'вісім', '9': 'дев\'ять'
        },
        en: {
            '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
            '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
        },
        crh: {
            '1': 'bir', '2': 'eki', '3': 'üç', '4': 'dört', '5': 'beş',
            '6': 'altı', '7': 'yedi', '8': 'sekiz', '9': 'doquz'
        },
        nl: {
            '1': 'een', '2': 'twee', '3': 'drie', '4': 'vier', '5': 'vijf',
            '6': 'zes', '7': 'zeven', '8': 'acht', '9': 'negen'
        }
    };

    const directionText = directionTexts[lang]?.[direction] || directionTexts.uk[direction];
    const numberText = numberTexts[lang]?.[distance] || numberTexts.uk[distance];

    // Формуємо текст залежно від мови
    switch (lang) {
        case 'uk':
            return `${numberText} ${directionText}`;
        case 'en':
            return `${numberText} ${directionText}`;
        case 'crh':
            return `${numberText} ${directionText}`;
        case 'nl':
            return `${numberText} ${directionText}`;
        default:
            return `${numberText} ${directionText}`;
    }
}

// Функція для ініціалізації голосів
function initVoices() {
    if (!isSpeechSupported) return;

    // Очікуємо завантаження голосів
    speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        
        // Завантажуємо збережені вибори голосів
        ['uk', 'en', 'crh', 'nl'].forEach(lang => {
            const savedVoiceName = localStorage.getItem(`speech_voice_${lang}`);
            if (savedVoiceName) {
                const savedVoice = voices.find(v => v.name === savedVoiceName);
                if (savedVoice) {
                    speechSettings[lang].voice = savedVoice;
                    return; // Якщо знайшли збережений голос, використовуємо його
                }
            }
            
            // Інакше використовуємо автоматичний вибір
            const langPrefixes = {
                uk: ['uk'],
                en: ['en'],
                crh: ['tr', 'en'],
                nl: ['nl']
            };
            
            const prefixes = langPrefixes[lang];
            let selectedVoice = null;
            
            // Спочатку шукаємо голос з потрібною мовою
            for (const prefix of prefixes) {
                selectedVoice = voices.find(voice => voice.lang.startsWith(prefix));
                if (selectedVoice) break;
            }
            
            // Якщо не знайшли, використовуємо англійський як fallback
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
            }
            
            // Якщо і англійського немає, беремо перший доступний
            if (!selectedVoice && voices.length > 0) {
                selectedVoice = voices[0];
            }
            
            speechSettings[lang].voice = selectedVoice;
        });
        
        console.log('[Speech] Голоси ініціалізовані:', {
            uk: speechSettings.uk.voice?.name,
            en: speechSettings.en.voice?.name,
            crh: speechSettings.crh.voice?.name,
            nl: speechSettings.nl.voice?.name
        });
    };
}

// Функція для озвучування ходу
function speakMove(direction, distance, lang = 'uk') {
    if (!isSpeechSupported) return;

    // Зупиняємо поточне озвучування
    speechSynthesis.cancel();

    const text = getMoveText(direction, distance, lang);
    const settings = speechSettings[lang] || speechSettings.uk;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = settings.voice;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.voice?.lang || 'uk-UA';

    // Додаємо обробники подій
    utterance.onstart = () => {
        console.log(`[Speech] Початок озвучування: "${text}" голосом: ${settings.voice?.name || 'default'}`);
    };

    utterance.onend = () => {
        console.log(`[Speech] Закінчення озвучування: "${text}"`);
    };

    utterance.onerror = (event) => {
        console.error(`[Speech] Помилка озвучування:`, event.error);
    };

    // Запускаємо озвучування
    speechSynthesis.speak(utterance);
}

// Функція для озвучування повідомлень про гру
function speakGameMessage(message, lang = 'uk') {
    if (!isSpeechSupported) return;

    // Зупиняємо поточне озвучування
    speechSynthesis.cancel();

    const settings = speechSettings[lang] || speechSettings.uk;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = settings.voice;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.voice?.lang || 'uk-UA';

    speechSynthesis.speak(utterance);
}

// Функція для зупинки озвучування
function stopSpeaking() {
    if (isSpeechSupported) {
        speechSynthesis.cancel();
    }
}

// Функція для перевірки підтримки мови
function isSpeechEnabled() {
    return isSpeechSupported;
}

// Функція для отримання поточного голосу для мови
function getCurrentVoice(lang) {
    return speechSettings[lang]?.voice || null;
}

// Експортуємо функції
export {
    speakMove,
    speakGameMessage,
    stopSpeaking,
    isSpeechEnabled,
    initVoices,
    getMoveText,
    getAvailableVoices,
    getVoicesForLanguage,
    setVoiceForLanguage,
    getCurrentVoice
}; 