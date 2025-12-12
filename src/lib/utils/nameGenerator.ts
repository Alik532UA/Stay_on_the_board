// Список назв для кімнат (Ігри)
export const ROOM_NAMES = [
    "FIFA", "SIMS", "NFS", "GTA", "Peek", "CS2",
    "TrackMania", "RoadRash", "Minecraft", "Tetris",
    "Doom", "Zelda", "Mario", "Portal", "Halo",
    "Cyberpunk", "Witcher", "Skyrim", "Fortnite", "Dota",
    "Sonic", "Metroid", "PacMan", "Diablo", "StarCraft"
];

// Список імен для гравців (Люди)
export const PLAYER_NAMES = [
    'Alik', 'Noah', 'Jack', 'Mateo', 'Lucas',
    'Sofia', 'Olivia', 'Nora', 'Lucia', 'Emilia',
    'Liam', 'Oliver', 'Elijah', 'James', 'William',
    'Benjamin', 'Henry', 'Mia', 'Evelyn', 'Harper'
];

/**
 * Генерує випадкову назву кімнати (Тільки назва гри).
 */
export function generateRandomRoomName(): string {
    return ROOM_NAMES[Math.floor(Math.random() * ROOM_NAMES.length)];
}

/**
 * Генерує випадкове ім'я гравця.
 */
export function generateRandomPlayerName(): string {
    return PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
}