/**
 * Unit тести для системи голосового управління
 */

// Імпортуємо TestRunner
const testRunner = new TestRunner();

// Мокаємо Web Speech API
const mockSpeechRecognition = {
    continuous: false,
    interimResults: false,
    maxAlternatives: 1,
    lang: 'uk-UA',
    onstart: null,
    onend: null,
    onresult: null,
    onerror: null,
    onnomatch: null,
    start: jest.fn(),
    stop: jest.fn()
};

const mockSpeechSynthesis = {
    speak: jest.fn(),
    cancel: jest.fn(),
    getVoices: jest.fn(() => [
        { name: 'Ukrainian', lang: 'uk-UA' },
        { name: 'English', lang: 'en-US' },
        { name: 'Dutch', lang: 'nl-NL' }
    ])
};

beforeEach(() => {
    // Мокаємо Web Speech API
    window.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
    window.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
    window.speechSynthesis = mockSpeechSynthesis;
    window.SpeechSynthesisUtterance = jest.fn();
    
    // Скидаємо моки
    mockSpeechRecognition.start.mockClear();
    mockSpeechRecognition.stop.mockClear();
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
});

afterEach(() => {
    if (window.speechManager) {
        window.speechManager.destroy();
    }
});

describe('SpeechManager', () => {
    test('should initialize with default options', () => {
        const speech = new SpeechManager();
        
        expect(speech.enabled).toBe(true);
        expect(speech.language).toBe('uk-UA');
        expect(speech.continuous).toBe(false);
        expect(speech.interimResults).toBe(false);
        expect(speech.isListening).toBe(false);
        expect(speech.isSpeaking).toBe(false);
        expect(speech.isDestroyed).toBe(false);
    });
    
    test('should initialize with custom options', () => {
        const options = {
            enabled: false,
            language: 'en-US',
            continuous: true,
            interimResults: true,
            maxAlternatives: 3,
            onResult: jest.fn(),
            onError: jest.fn(),
            onStart: jest.fn(),
            onEnd: jest.fn()
        };
        
        const speech = new SpeechManager(options);
        
        expect(speech.enabled).toBe(options.enabled);
        expect(speech.language).toBe(options.language);
        expect(speech.continuous).toBe(options.continuous);
        expect(speech.interimResults).toBe(options.interimResults);
        expect(speech.maxAlternatives).toBe(options.maxAlternatives);
        expect(speech.onResult).toBe(options.onResult);
        expect(speech.onError).toBe(options.onError);
        expect(speech.onStart).toBe(options.onStart);
        expect(speech.onEnd).toBe(options.onEnd);
    });
    
    test('should handle unsupported speech recognition', () => {
        // Видаляємо підтримку
        delete window.SpeechRecognition;
        delete window.webkitSpeechRecognition;
        
        const speech = new SpeechManager();
        
        expect(speech.enabled).toBe(false);
        expect(speech.recognition).toBe(null);
    });
    
    test('should handle unsupported speech synthesis', () => {
        delete window.speechSynthesis;
        
        const speech = new SpeechManager();
        
        expect(speech.synthesis).toBe(null);
    });
    
    test('should register commands', () => {
        const speech = new SpeechManager();
        const mockHandler = jest.fn();
        
        speech.registerCommand('test command', mockHandler);
        
        expect(speech.commands.has('test command')).toBe(true);
        expect(speech.commands.get('test command')).toBe(mockHandler);
    });
    
    test('should register aliases', () => {
        const speech = new SpeechManager();
        
        speech.registerAlias('alias', 'command');
        
        expect(speech.aliases.has('alias')).toBe(true);
        expect(speech.aliases.get('alias')).toBe('command');
    });
    
    test('should calculate string similarity', () => {
        const speech = new SpeechManager();
        
        expect(speech.calculateSimilarity('test', 'test')).toBe(1.0);
        expect(speech.calculateSimilarity('test', 'tst')).toBeGreaterThan(0.5);
        expect(speech.calculateSimilarity('test', 'different')).toBeLessThan(0.5);
        expect(speech.calculateSimilarity('', '')).toBe(1.0);
    });
    
    test('should calculate Levenshtein distance', () => {
        const speech = new SpeechManager();
        
        expect(speech.levenshteinDistance('test', 'test')).toBe(0);
        expect(speech.levenshteinDistance('test', 'tst')).toBe(1);
        expect(speech.levenshteinDistance('test', 'different')).toBe(8);
        expect(speech.levenshteinDistance('', 'test')).toBe(4);
        expect(speech.levenshteinDistance('test', '')).toBe(4);
    });
    
    test('should process commands with exact match', () => {
        const speech = new SpeechManager();
        const mockHandler = jest.fn();
        
        speech.registerCommand('test command', mockHandler);
        speech.processCommand('test command', 0.9);
        
        expect(mockHandler).toHaveBeenCalled();
    });
    
    test('should process commands with alias', () => {
        const speech = new SpeechManager();
        const mockHandler = jest.fn();
        
        speech.registerCommand('test command', mockHandler);
        speech.registerAlias('alias', 'test command');
        speech.processCommand('alias', 0.9);
        
        expect(mockHandler).toHaveBeenCalled();
    });
    
    test('should process commands with similarity', () => {
        const speech = new SpeechManager();
        const mockHandler = jest.fn();
        
        speech.registerCommand('test command', mockHandler);
        speech.processCommand('test comand', 0.9); // Опечатка
        
        expect(mockHandler).toHaveBeenCalled();
    });
    
    test('should not process commands below similarity threshold', () => {
        const speech = new SpeechManager();
        const mockHandler = jest.fn();
        
        speech.registerCommand('test command', mockHandler);
        speech.processCommand('completely different', 0.9);
        
        expect(mockHandler).not.toHaveBeenCalled();
    });
    
    test('should start listening', () => {
        const speech = new SpeechManager();
        
        speech.startListening();
        
        expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });
    
    test('should not start listening when disabled', () => {
        const speech = new SpeechManager({ enabled: false });
        
        speech.startListening();
        
        expect(mockSpeechRecognition.start).not.toHaveBeenCalled();
    });
    
    test('should not start listening when destroyed', () => {
        const speech = new SpeechManager();
        speech.destroy();
        
        speech.startListening();
        
        expect(mockSpeechRecognition.start).not.toHaveBeenCalled();
    });
    
    test('should stop listening', () => {
        const speech = new SpeechManager();
        
        speech.stopListening();
        
        expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });
    
    test('should speak text', () => {
        const speech = new SpeechManager();
        
        speech.speak('Test text');
        
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
        expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('Test text');
    });
    
    test('should speak text with options', () => {
        const speech = new SpeechManager();
        const options = {
            voice: { name: 'Test Voice' },
            rate: 1.5,
            pitch: 0.8,
            volume: 0.9,
            lang: 'en-US'
        };
        
        speech.speak('Test text', options);
        
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
        expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('Test text');
    });
    
    test('should not speak when synthesis not supported', () => {
        delete window.speechSynthesis;
        const speech = new SpeechManager();
        
        speech.speak('Test text');
        
        expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
    
    test('should not speak when destroyed', () => {
        const speech = new SpeechManager();
        speech.destroy();
        
        speech.speak('Test text');
        
        expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
    
    test('should stop speaking', () => {
        const speech = new SpeechManager();
        
        speech.stopSpeaking();
        
        expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
    
    test('should get voices', () => {
        const speech = new SpeechManager();
        
        const voices = speech.getVoices();
        
        expect(voices).toHaveLength(3);
        expect(voices[0].lang).toBe('uk-UA');
        expect(voices[1].lang).toBe('en-US');
        expect(voices[2].lang).toBe('nl-NL');
    });
    
    test('should set language', () => {
        const speech = new SpeechManager();
        
        speech.setLanguage('en-US');
        
        expect(speech.language).toBe('en-US');
        expect(speech.recognition.lang).toBe('en-US');
    });
    
    test('should set enabled', () => {
        const speech = new SpeechManager();
        
        speech.setEnabled(false);
        
        expect(speech.enabled).toBe(false);
    });
    
    test('should stop listening when disabled', () => {
        const speech = new SpeechManager();
        speech.isListening = true;
        
        speech.setEnabled(false);
        
        expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });
    
    test('should stop speaking when disabled', () => {
        const speech = new SpeechManager();
        speech.isSpeaking = true;
        
        speech.setEnabled(false);
        
        expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
    
    test('should get status', () => {
        const speech = new SpeechManager();
        
        const status = speech.getStatus();
        
        expect(status.enabled).toBe(true);
        expect(status.isListening).toBe(false);
        expect(status.isSpeaking).toBe(false);
        expect(status.language).toBe('uk-UA');
        expect(status.commandsCount).toBeGreaterThan(0);
        expect(status.aliasesCount).toBeGreaterThan(0);
        expect(status.voicesAvailable).toBe(3);
    });
    
    test('should get stats', () => {
        const speech = new SpeechManager();
        
        const stats = speech.getStats();
        
        expect(stats.commandsExecuted).toBe(0);
        expect(stats.recognitionErrors).toBe(0);
        expect(stats.synthesisErrors).toBe(0);
    });
    
    test('should destroy instance', () => {
        const speech = new SpeechManager();
        speech.isListening = true;
        speech.isSpeaking = true;
        
        speech.destroy();
        
        expect(speech.isDestroyed).toBe(true);
        expect(speech.isListening).toBe(false);
        expect(speech.isSpeaking).toBe(false);
        expect(speech.commands.size).toBe(0);
        expect(speech.aliases.size).toBe(0);
    });
    
    test('should handle recognition start event', () => {
        const speech = new SpeechManager();
        const mockOnStart = jest.fn();
        speech.onStart = mockOnStart;
        
        speech.recognition.onstart();
        
        expect(speech.isListening).toBe(true);
        expect(mockOnStart).toHaveBeenCalled();
    });
    
    test('should handle recognition end event', () => {
        const speech = new SpeechManager();
        const mockOnEnd = jest.fn();
        speech.onEnd = mockOnEnd;
        speech.isListening = true;
        
        speech.recognition.onend();
        
        expect(speech.isListening).toBe(false);
        expect(mockOnEnd).toHaveBeenCalled();
    });
    
    test('should handle recognition result event', () => {
        const speech = new SpeechManager();
        const mockOnResult = jest.fn();
        speech.onResult = mockOnResult;
        
        const mockEvent = {
            results: [
                [{ transcript: 'test command', confidence: 0.9 }]
            ]
        };
        
        speech.recognition.onresult(mockEvent);
        
        expect(mockOnResult).toHaveBeenCalledWith('test command', 0.9);
    });
    
    test('should handle recognition error event', () => {
        const speech = new SpeechManager();
        const mockOnError = jest.fn();
        speech.onError = mockOnError;
        
        const mockEvent = { error: 'test error' };
        
        speech.recognition.onerror(mockEvent);
        
        expect(mockOnError).toHaveBeenCalledWith('test error');
    });
    
    test('should handle game direction commands', () => {
        const speech = new SpeechManager();
        
        // Мокаємо stateManager
        const mockStateManager = {
            getState: jest.fn(() => true),
            setState: jest.fn()
        };
        window.stateManager = mockStateManager;
        
        speech.handleDirectionCommand('up');
        
        expect(mockStateManager.setState).toHaveBeenCalledWith('game.selectedDirection', 'up');
    });
    
    test('should handle game distance commands', () => {
        const speech = new SpeechManager();
        
        const mockStateManager = {
            getState: jest.fn(() => true),
            setState: jest.fn()
        };
        window.stateManager = mockStateManager;
        
        speech.handleDistanceCommand(3);
        
        expect(mockStateManager.setState).toHaveBeenCalledWith('game.selectedDistance', 3);
    });
    
    test('should handle confirm command', () => {
        const speech = new SpeechManager();
        
        const mockStateManager = {
            getState: jest.fn((path) => {
                if (path === 'game.isActive') return true;
                if (path === 'game.selectedDirection') return 'up';
                if (path === 'game.selectedDistance') return 2;
                return null;
            }),
            setState: jest.fn()
        };
        window.stateManager = mockStateManager;
        
        speech.handleConfirmCommand();
        
        // Перевіряємо що speak був викликаний
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
    
    test('should handle cancel command', () => {
        const speech = new SpeechManager();
        
        const mockStateManager = {
            getState: jest.fn(() => true),
            setState: jest.fn()
        };
        window.stateManager = mockStateManager;
        
        speech.handleCancelCommand();
        
        expect(mockStateManager.setState).toHaveBeenCalledWith('game.selectedDirection', null);
        expect(mockStateManager.setState).toHaveBeenCalledWith('game.selectedDistance', null);
    });
});

// Запускаємо тести
testRunner.run().then(summary => {
    console.log('Speech tests completed:', summary);
}); 