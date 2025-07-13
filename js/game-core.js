// Основна логіка гри (game-core.js)
import { Logger } from './utils/logger.js';

export function createEmptyBoard(size) {
    Logger.debug('[GameCore] createEmptyBoard called with size:', { size });
    
    // Валідація розміру дошки
    if (size < 2 || size > 9) {
        Logger.error('[GameCore] Invalid board size:', { size });
        return null;
    }
    
    const board = Array(size).fill(0).map(() => Array(size).fill(0));
    Logger.debug('[GameCore] Created empty board with size:', { rows: board.length, cols: board[0].length });
    return board;
}

export function findPiece(board, player) {
    Logger.debug('[GameCore] findPiece called with player:', { player, boardSize: board.length });
    
    // Валідація вхідних даних
    if (!Array.isArray(board) || board.length === 0) {
        Logger.error('[GameCore] Invalid board in findPiece:', { board });
        return null;
    }
    
    const size = board.length; // Визначаємо розмір з самої дошки
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i] && board[i][j] === player) {
                Logger.debug('[GameCore] Found piece at:', { row: i, col: j });
                return { row: i, col: j };
            }
        }
    }
    Logger.debug('[GameCore] No piece found for player:', { player });
    return null;
}

export function getDirectionDelta(side) {
    const directions = {
        '7': { dr: -1, dc: -1 }, '8': { dr: -1, dc: 0 }, '9': { dr: -1, dc: 1 },
        '4': { dr: 0, dc: -1 }, '6': { dr: 0, dc: 1 },
        '1': { dr: 1, dc: -1 }, '2': { dr: 1, dc: 0 }, '3': { dr: 1, dc: 1 }
    };
    const delta = directions[side] || { dr: 0, dc: 0 };
    // Прибираємо надмірне логування - ця функція викликається 8 разів для кожної позиції
    return delta;
}

export function getAllValidMoves(board, row, col, player, blockedCells = [], blockedMode = false) {
    Logger.debug('[GameCore] getAllValidMoves called with:', { row, col, player, boardSize: board.length });
    
    // Валідація вхідних даних
    if (!Array.isArray(board) || board.length === 0) {
        Logger.error('[GameCore] Invalid board in getAllValidMoves:', { board });
        return [];
    }
    
    // Використовуємо передані координати row та col замість пошуку фігури
    if (row < 0 || row >= board.length || col < 0 || col >= board.length) {
        Logger.debug('[GameCore] Invalid coordinates, returning empty array');
        return [];
    }
    
    const validMoves = [];
    // Перемішуємо напрямки для кращої випадковості
    const directions = [1, 2, 3, 4, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const size = board.length;
    
    Logger.debug('[GameCore] Checking moves for board size:', { size, fromPosition: { row, col } });
    
    for (const direction of directions) {
        for (let distance = 1; distance < size; distance++) {
            const { dr, dc } = getDirectionDelta(direction);
            const newRow = row + dr * distance;
            const newCol = col + dc * distance;
            
            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                // Перевіряємо, чи клітинка вільна
                if (board[newRow][newCol] === 0) {
                    if (!blockedMode || !blockedCells.some(pos => pos.row === newRow && pos.col === newCol)) {
                        validMoves.push({
                            direction,
                            distance,
                            newRow,
                            newCol
                        });
                    }
                }
            }
        }
    }
    
    Logger.debug('[GameCore] Found valid moves:', { count: validMoves.length });
    return validMoves;
}

export function hasValidMoves(board, row, col, player, blockedCells = [], blockedMode = false) {
    // Валідація вхідних даних
    if (!Array.isArray(board) || board.length === 0) {
        Logger.error('[GameCore] Invalid board in hasValidMoves:', { board });
        return false;
    }
    
    const moves = getAllValidMoves(board, row, col, player, blockedCells, blockedMode);
    Logger.debug('[GameCore] hasValidMoves:', { hasMoves: moves.length > 0, count: moves.length });
    return moves.length > 0;
}

export function getDirectionText(side, lang = null) {
    lang = lang || (localStorage.getItem('lang') || 'uk');
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
    const text = (directionTexts[lang] && directionTexts[lang][side]) || directionTexts.uk[side] || '...';
    Logger.debug('[GameCore] getDirectionText:', { side, lang, text });
    return text;
}

export function getDirectionArrow(side) {
    const arrows = {
        '7': '↖', '8': '↑', '9': '↗',
        '4': '←', '6': '→',
        '1': '↙', '2': '↓', '3': '↘'
    };
    const arrow = arrows[side] || '?';
    Logger.debug('[GameCore] getDirectionArrow:', { side, arrow });
    return arrow;
} 