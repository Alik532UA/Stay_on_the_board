// network.js — онлайн-логіка (PeerJS, кімнати)

// Конфіг для PeerJS Cloud (без host/path/port, бо 0.peerjs.com більше не підтримує listAllPeers)
const PEER_CONFIG = {
    debug: 0 // Можна збільшити для дебагу
};

// Допоміжна функція створення Peer-обʼєкта
function createPeer(id = undefined) {
    // eslint-disable-next-line no-undef
    return new Peer(id, PEER_CONFIG);
}

// ===== Створення / підʼєднання кімнат =====

/**
 * Повертає проміс зі списком доступних кімнат (ID без префікса "room_").
 */
export function listRooms() {
    return new Promise((resolve) => {
        const tempPeer = createPeer();
        tempPeer.on('open', () => {
            tempPeer.listAllPeers((peers) => {
                const rooms = peers
                    .filter((p) => p.startsWith('room_'))
                    .map((p) => p.substring(5).toUpperCase());
                resolve(rooms);
                setTimeout(() => tempPeer.destroy(), 0);
            });
        });
        tempPeer.on('error', (err) => {
            console.error('[PeerJS] listRooms error', err);
            resolve([]);
        });
    });
}

/**
 * Створює кімнату-хост. Повертає { roomId, peer, onConnection(conn) }.
 * onConnection буде викликано при підключенні гостя.
 */
export function hostRoom(roomName, onConnection, onError) {
    const roomId = roomName ? roomName.toUpperCase() : generateRoomId();
    const peer = createPeer('room_' + roomId);

    peer.on('open', () => {
        console.log('[PeerJS] Host peer opened', roomId);
    });

    peer.on('connection', (conn) => {
        console.log('[PeerJS] Guest connected');
        onConnection(conn);
    });

    if (onError) peer.on('error', onError);
    return { roomId, peer };
}

/**
 * Підключається до існуючої кімнати. Повертає { peer, conn } через колбек.
 */
export function joinRoom(roomId, onConnected, onError) {
    const peer = createPeer();
    let connRef = null;
    peer.on('open', () => {
        connRef = peer.connect('room_' + roomId);
        connRef.on('open', () => {
            console.log('[PeerJS] Connected to host');
            onConnected(connRef);
        });
        if (onError) connRef.on('error', onError);
    });
    if (onError) peer.on('error', onError);
    return { peer, getConnection: () => connRef };
}

/**
 * Допоміжна: відправка даних, якщо зʼєднання відкрите.
 */
export function sendMessage(conn, payload) {
    if (conn && conn.open) {
        conn.send(JSON.stringify(payload));
    }
}

// ===== Генератор ID кімнати (до 8 символів) =====
export function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Функції-заглушки для зворотної сумісності (буде перевизначено у game.js)
export function sendMoveToOpponent() {}
export function endOnlineGame() {} 