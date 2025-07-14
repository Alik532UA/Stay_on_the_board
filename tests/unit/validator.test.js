/**
 * Unit тести для системи валідації
 */

// Імпортуємо TestRunner
const testRunner = new TestRunner();

describe('Validator', () => {
    let validator;
    
    beforeEach(() => {
        validator = new Validator();
    });
    
    afterEach(() => {
        validator = null;
    });
    
    describe('String validation', () => {
        test('should validate required field', () => {
            expect(validator.validate('', 'required')).toBe(false);
            expect(validator.validate('   ', 'required')).toBe(false);
            expect(validator.validate(null, 'required')).toBe(false);
            expect(validator.validate(undefined, 'required')).toBe(false);
            expect(validator.validate('test', 'required')).toBe(true);
            expect(validator.validate(' test ', 'required')).toBe(true);
        });
        
        test('should validate minLength', () => {
            expect(validator.validate('test', 'minLength', 5)).toBe(false);
            expect(validator.validate('test', 'minLength', 4)).toBe(true);
            expect(validator.validate('test', 'minLength', 3)).toBe(true);
            expect(validator.validate('', 'minLength', 1)).toBe(false);
        });
        
        test('should validate maxLength', () => {
            expect(validator.validate('test', 'maxLength', 3)).toBe(false);
            expect(validator.validate('test', 'maxLength', 4)).toBe(true);
            expect(validator.validate('test', 'maxLength', 5)).toBe(true);
        });
        
        test('should validate email', () => {
            expect(validator.validate('test@example.com', 'email')).toBe(true);
            expect(validator.validate('test@example', 'email')).toBe(false);
            expect(validator.validate('test.example.com', 'email')).toBe(false);
            expect(validator.validate('@example.com', 'email')).toBe(false);
            expect(validator.validate('test@', 'email')).toBe(false);
        });
        
        test('should validate URL', () => {
            expect(validator.validate('https://example.com', 'url')).toBe(true);
            expect(validator.validate('http://example.com', 'url')).toBe(true);
            expect(validator.validate('ftp://example.com', 'url')).toBe(true);
            expect(validator.validate('example.com', 'url')).toBe(false);
            expect(validator.validate('not-a-url', 'url')).toBe(false);
        });
        
        test('should validate pattern', () => {
            expect(validator.validate('abc123', 'pattern', '^[a-z0-9]+$')).toBe(true);
            expect(validator.validate('ABC123', 'pattern', '^[a-z0-9]+$')).toBe(false);
            expect(validator.validate('abc-123', 'pattern', '^[a-z0-9]+$')).toBe(false);
        });
    });
    
    describe('Number validation', () => {
        test('should validate min', () => {
            expect(validator.validate(5, 'min', 10)).toBe(false);
            expect(validator.validate(10, 'min', 10)).toBe(true);
            expect(validator.validate(15, 'min', 10)).toBe(true);
            expect(validator.validate('15', 'min', 10)).toBe(true);
        });
        
        test('should validate max', () => {
            expect(validator.validate(15, 'max', 10)).toBe(false);
            expect(validator.validate(10, 'max', 10)).toBe(true);
            expect(validator.validate(5, 'max', 10)).toBe(true);
        });
        
        test('should validate range', () => {
            expect(validator.validate(5, 'range', 10, 20)).toBe(false);
            expect(validator.validate(10, 'range', 10, 20)).toBe(true);
            expect(validator.validate(15, 'range', 10, 20)).toBe(true);
            expect(validator.validate(20, 'range', 10, 20)).toBe(true);
            expect(validator.validate(25, 'range', 10, 20)).toBe(false);
        });
        
        test('should validate integer', () => {
            expect(validator.validate(5, 'integer')).toBe(true);
            expect(validator.validate(5.5, 'integer')).toBe(false);
            expect(validator.validate('5', 'integer')).toBe(true);
            expect(validator.validate('5.5', 'integer')).toBe(false);
        });
        
        test('should validate positive', () => {
            expect(validator.validate(5, 'positive')).toBe(true);
            expect(validator.validate(0, 'positive')).toBe(false);
            expect(validator.validate(-5, 'positive')).toBe(false);
        });
        
        test('should validate negative', () => {
            expect(validator.validate(-5, 'negative')).toBe(true);
            expect(validator.validate(0, 'negative')).toBe(false);
            expect(validator.validate(5, 'negative')).toBe(false);
        });
    });
    
    describe('Array validation', () => {
        test('should validate minItems', () => {
            expect(validator.validate([1, 2], 'minItems', 3)).toBe(false);
            expect(validator.validate([1, 2, 3], 'minItems', 3)).toBe(true);
            expect(validator.validate([1, 2, 3, 4], 'minItems', 3)).toBe(true);
        });
        
        test('should validate maxItems', () => {
            expect(validator.validate([1, 2, 3, 4], 'maxItems', 3)).toBe(false);
            expect(validator.validate([1, 2, 3], 'maxItems', 3)).toBe(true);
            expect(validator.validate([1, 2], 'maxItems', 3)).toBe(true);
        });
        
        test('should validate unique', () => {
            expect(validator.validate([1, 2, 3], 'unique')).toBe(true);
            expect(validator.validate([1, 2, 2], 'unique')).toBe(false);
            expect(validator.validate([1, 1, 1], 'unique')).toBe(false);
        });
    });
    
    describe('Object validation', () => {
        test('should validate hasKeys', () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(validator.validate(obj, 'hasKeys', ['a', 'b'])).toBe(true);
            expect(validator.validate(obj, 'hasKeys', ['a', 'd'])).toBe(false);
        });
        
        test('should validate hasValues', () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(validator.validate(obj, 'hasValues', [1, 2])).toBe(true);
            expect(validator.validate(obj, 'hasValues', [1, 4])).toBe(false);
        });
    });
    
    describe('Date validation', () => {
        test('should validate date', () => {
            expect(validator.validate(new Date(), 'date')).toBe(true);
            expect(validator.validate('2023-01-01', 'date')).toBe(true);
            expect(validator.validate('invalid-date', 'date')).toBe(false);
        });
        
        test('should validate future', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);
            
            expect(validator.validate(futureDate, 'future')).toBe(true);
            expect(validator.validate(pastDate, 'future')).toBe(false);
        });
        
        test('should validate past', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);
            
            expect(validator.validate(pastDate, 'past')).toBe(true);
            expect(validator.validate(futureDate, 'past')).toBe(false);
        });
    });
    
    describe('File validation', () => {
        test('should validate fileSize', () => {
            const file = new File(['test'], 'test.txt', { type: 'text/plain' });
            expect(validator.validate(file, 'fileSize', 100)).toBe(true);
            expect(validator.validate(file, 'fileSize', 1)).toBe(false);
        });
        
        test('should validate fileType', () => {
            const file = new File(['test'], 'test.txt', { type: 'text/plain' });
            expect(validator.validate(file, 'fileType', ['text/plain'])).toBe(true);
            expect(validator.validate(file, 'fileType', ['image/jpeg'])).toBe(false);
        });
    });
    
    describe('Game-specific validation', () => {
        test('should validate boardSize', () => {
            expect(validator.validate(3, 'boardSize')).toBe(true);
            expect(validator.validate(5, 'boardSize')).toBe(true);
            expect(validator.validate(10, 'boardSize')).toBe(true);
            expect(validator.validate(2, 'boardSize')).toBe(false);
            expect(validator.validate(11, 'boardSize')).toBe(false);
        });
        
        test('should validate playerNumber', () => {
            expect(validator.validate(1, 'playerNumber')).toBe(true);
            expect(validator.validate(2, 'playerNumber')).toBe(true);
            expect(validator.validate(3, 'playerNumber')).toBe(false);
            expect(validator.validate(0, 'playerNumber')).toBe(false);
        });
        
        test('should validate validMove', () => {
            expect(validator.validate({ row: 0, col: 0 }, 'validMove')).toBe(true);
            expect(validator.validate({ row: 5, col: 3 }, 'validMove')).toBe(true);
            expect(validator.validate({ row: -1, col: 0 }, 'validMove')).toBe(false);
            expect(validator.validate({ row: 0, col: -1 }, 'validMove')).toBe(false);
            expect(validator.validate({ row: 0.5, col: 0 }, 'validMove')).toBe(false);
            expect(validator.validate({ row: 0 }, 'validMove')).toBe(false);
            expect(validator.validate(null, 'validMove')).toBe(false);
        });
        
        test('should validate gameMode', () => {
            expect(validator.validate('vsComputer', 'gameMode')).toBe(true);
            expect(validator.validate('localTwoPlayer', 'gameMode')).toBe(true);
            expect(validator.validate('online', 'gameMode')).toBe(true);
            expect(validator.validate('invalid', 'gameMode')).toBe(false);
        });
        
        test('should validate language', () => {
            expect(validator.validate('uk', 'language')).toBe(true);
            expect(validator.validate('en', 'language')).toBe(true);
            expect(validator.validate('nl', 'language')).toBe(true);
            expect(validator.validate('crh', 'language')).toBe(true);
            expect(validator.validate('fr', 'language')).toBe(false);
        });
        
        test('should validate theme', () => {
            expect(validator.validate('light', 'theme')).toBe(true);
            expect(validator.validate('dark', 'theme')).toBe(true);
            expect(validator.validate('blue', 'theme')).toBe(false);
        });
        
        test('should validate style', () => {
            expect(validator.validate('classic', 'style')).toBe(true);
            expect(validator.validate('peak', 'style')).toBe(true);
            expect(validator.validate('cs2', 'style')).toBe(true);
            expect(validator.validate('glass', 'style')).toBe(true);
            expect(validator.validate('material', 'style')).toBe(true);
            expect(validator.validate('modern', 'style')).toBe(false);
        });
    });
    
    describe('Value validation', () => {
        test('should validate value with array of rules', () => {
            const result = validator.validateValue('test', ['required', 'minLength:3']);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        
        test('should validate value with object of rules', () => {
            const result = validator.validateValue('test', {
                required: true,
                minLength: 3,
                maxLength: 10
            });
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        
        test('should return errors for invalid value', () => {
            const result = validator.validateValue('', ['required', 'minLength:3']);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2);
        });
    });
    
    describe('Object validation', () => {
        test('should validate object with schema', () => {
            const data = {
                name: 'Test',
                email: 'test@example.com',
                age: 25
            };
            
            const schema = {
                name: ['required', 'minLength:2'],
                email: ['required', 'email'],
                age: ['required', 'min:18']
            };
            
            const result = validator.validateObject(data, schema);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });
        
        test('should return errors for invalid object', () => {
            const data = {
                name: '',
                email: 'invalid-email',
                age: 15
            };
            
            const schema = {
                name: ['required', 'minLength:2'],
                email: ['required', 'email'],
                age: ['required', 'min:18']
            };
            
            const result = validator.validateObject(data, schema);
            expect(result.isValid).toBe(false);
            expect(result.errors.name).toBeDefined();
            expect(result.errors.email).toBeDefined();
            expect(result.errors.age).toBeDefined();
        });
    });
    
    describe('Game state validation', () => {
        test('should validate valid game state', () => {
            const gameState = {
                isActive: true,
                board: [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
                currentPlayer: 1,
                points: 10,
                boardSize: 3,
                gameMode: 'vsComputer'
            };
            
            const result = validator.validateGameState(gameState);
            expect(result.isValid).toBe(true);
        });
        
        test('should validate invalid game state', () => {
            const gameState = {
                isActive: null,
                board: [],
                currentPlayer: 3,
                points: -5,
                boardSize: 2,
                gameMode: 'invalid'
            };
            
            const result = validator.validateGameState(gameState);
            expect(result.isValid).toBe(false);
        });
    });
    
    describe('Settings validation', () => {
        test('should validate valid settings', () => {
            const settings = {
                language: 'uk',
                theme: 'dark',
                style: 'classic',
                speechEnabled: true,
                showBoard: true,
                showMoves: true, // За замовчуванням true
                blockedMode: false
            };
            
            const result = validator.validateSettings(settings);
            expect(result.isValid).toBe(true);
        });
        
        test('should validate invalid settings', () => {
            const settings = {
                language: 'fr',
                theme: 'blue',
                style: 'modern',
                speechEnabled: null,
                showBoard: null,
                showMoves: null,
                blockedMode: null
            };
            
            const result = validator.validateSettings(settings);
            expect(result.isValid).toBe(false);
        });
    });
    
    describe('Move validation', () => {
        test('should validate valid move', () => {
            const move = { row: 1, col: 2 };
            const gameState = {
                boardSize: 5,
                board: [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ]
            };
            
            const result = validator.validateMove(move, gameState);
            expect(result.isValid).toBe(true);
        });
        
        test('should validate invalid move - out of bounds', () => {
            const move = { row: 5, col: 2 };
            const gameState = {
                boardSize: 5,
                board: [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ]
            };
            
            const result = validator.validateMove(move, gameState);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Хід поза межами дошки');
        });
        
        test('should validate invalid move - occupied cell', () => {
            const move = { row: 1, col: 2 };
            const gameState = {
                boardSize: 5,
                board: [
                    [0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ]
            };
            
            const result = validator.validateMove(move, gameState);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Клітинка вже зайнята');
        });
    });
    
    describe('Custom validators', () => {
        test('should add and use custom validator', () => {
            validator.addCustomValidator('evenNumber', (value) => {
                return Number(value) % 2 === 0;
            });
            
            expect(validator.validate(2, 'evenNumber')).toBe(true);
            expect(validator.validate(3, 'evenNumber')).toBe(false);
        });
        
        test('should add custom message', () => {
            validator.setMessage('evenNumber', 'Число повинно бути парним');
            
            const result = validator.validateValue(3, ['evenNumber']);
            expect(result.errors).toContain('Число повинно бути парним');
        });
    });
    
    describe('Message formatting', () => {
        test('should format message with parameters', () => {
            const message = validator.getMessage('minLength', 5);
            expect(message).toBe('Мінімальна довжина: 5 символів');
        });
        
        test('should format message with multiple parameters', () => {
            const message = validator.getMessage('range', 10, 20);
            expect(message).toBe('Значення повинно бути між 10 та 20');
        });
    });
});

// Запускаємо тести
testRunner.run().then(summary => {
    Logger.info('Validator tests completed:', summary);
}); 