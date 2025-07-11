// Основна логіка гри (game-core.js)
export function createEmptyBoard(size) {
    return Array(size).fill(0).map(() => Array(size).fill(0));
}

export function findPiece(board, size) {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j] === 1) return { row: i, col: j };
        }
    }
    return null;
}

export function getDirectionDelta(side) {
    const directions = {
        '7': { dr: -1, dc: -1 }, '8': { dr: -1, dc: 0 }, '9': { dr: -1, dc: 1 },
        '4': { dr: 0, dc: -1 }, '6': { dr: 0, dc: 1 },
        '1': { dr: 1, dc: -1 }, '2': { dr: 1, dc: 0 }, '3': { dr: 1, dc: 1 }
    };
    return directions[side] || { dr: 0, dc: 0 };
}

export function getAllValidMoves(board, blockedCells, blockedMode, size) {
    const piecePos = findPiece(board, size);
    if (!piecePos) return [];
    const validMoves = [];
    const { row, col } = piecePos;
    const directions = [1, 2, 3, 4, 6, 7, 8, 9];
    for (const direction of directions) {
        for (let distance = 1; distance < size; distance++) {
            const { dr, dc } = getDirectionDelta(direction);
            const newRow = row + dr * distance;
            const newCol = col + dc * distance;
            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
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
    return validMoves;
}

export function hasValidMoves(board, blockedCells, blockedMode, size) {
    return getAllValidMoves(board, blockedCells, blockedMode, size).length > 0;
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
    return (directionTexts[lang] && directionTexts[lang][side]) || directionTexts.uk[side] || '...';
}

export function getDirectionArrow(side) {
    const arrows = {
        '7': '↖', '8': '↑', '9': '↗',
        '4': '←', '6': '→',
        '1': '↙', '2': '↓', '3': '↘'
    };
    return arrows[side] || '?';
} 