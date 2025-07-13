/**
 * WebRTC Manager для онлайн гри
 * Використовує PeerJS для P2P з'єднань
 */
class WebRTCManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.roomId = null;
        this.isHost = false;
        this.playerName = '';
        this.onConnectionEstablished = null;
        this.onDataReceived = null;
        this.onConnectionClosed = null;
        this.onError = null;
    }

    /**
     * Ініціалізує PeerJS
     * @param {string} playerName - Ім'я гравця
     * @returns {Promise<string>} ID піра
     */
    async initialize(playerName = 'Player') {
        try {
            // Перевіряємо чи завантажений PeerJS
            if (typeof Peer === 'undefined') {
                throw new Error('PeerJS не завантажений');
            }

            this.playerName = playerName;
            this.peer = new Peer({
                host: 'peerjs-server.herokuapp.com',
                port: 443,
                secure: true,
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            return new Promise((resolve, reject) => {
                this.peer.on('open', (id) => {
                    console.log('[WebRTCManager] Peer відкрито з ID:', id);
                    resolve(id);
                });

                this.peer.on('error', (error) => {
                    console.error('[WebRTCManager] Peer помилка:', error);
                    reject(error);
                });
            });
        } catch (error) {
            console.error('[WebRTCManager] Помилка ініціалізації:', error);
            throw error;
        }
    }

    /**
     * Створює кімнату (хост)
     * @param {string} roomId - ID кімнати
     * @param {Object} gameConfig - Конфігурація гри
     * @returns {Promise<void>}
     */
    async createRoom(roomId, gameConfig = {}) {
        try {
            if (!this.peer) {
                throw new Error('Peer не ініціалізований');
            }

            this.roomId = roomId;
            this.isHost = true;

            // Очікуємо підключення гостя
            this.peer.on('connection', (conn) => {
                console.log('[WebRTCManager] Отримано з\'єднання від гостя');
                this.setupConnection(conn);
            });

            console.log('[WebRTCManager] Кімната створена:', roomId);
        } catch (error) {
            console.error('[WebRTCManager] Помилка створення кімнати:', error);
            throw error;
        }
    }

    /**
     * Приєднується до кімнати (гість)
     * @param {string} roomId - ID кімнати
     * @returns {Promise<void>}
     */
    async joinRoom(roomId) {
        try {
            if (!this.peer) {
                throw new Error('Peer не ініціалізований');
            }

            this.roomId = roomId;
            this.isHost = false;

            // Підключаємося до хоста
            const conn = this.peer.connect(roomId, {
                reliable: true
            });

            this.setupConnection(conn);

            console.log('[WebRTCManager] Підключення до кімнати:', roomId);
        } catch (error) {
            console.error('[WebRTCManager] Помилка підключення до кімнати:', error);
            throw error;
        }
    }

    /**
     * Налаштовує з'єднання
     * @param {Object} conn - PeerJS з'єднання
     */
    setupConnection(conn) {
        this.connection = conn;

        conn.on('open', () => {
            console.log('[WebRTCManager] З\'єднання встановлено');
            
            // Відправляємо інформацію про гравця
            conn.send({
                type: 'player_info',
                name: this.playerName,
                isHost: this.isHost
            });

            if (this.onConnectionEstablished) {
                this.onConnectionEstablished();
            }
        });

        conn.on('data', (data) => {
            console.log('[WebRTCManager] Отримано дані:', data);
            
            if (this.onDataReceived) {
                this.onDataReceived(data);
            }
        });

        conn.on('close', () => {
            console.log('[WebRTCManager] З\'єднання закрито');
            
            if (this.onConnectionClosed) {
                this.onConnectionClosed();
            }
        });

        conn.on('error', (error) => {
            console.error('[WebRTCManager] Помилка з\'єднання:', error);
            
            if (this.onError) {
                this.onError(error);
            }
        });
    }

    /**
     * Відправляє дані через з'єднання
     * @param {Object} data - Дані для відправки
     */
    sendData(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        } else {
            console.warn('[WebRTCManager] З\'єднання не встановлено');
        }
    }

    /**
     * Відправляє хід
     * @param {Object} move - Дані ходу
     */
    sendMove(move) {
        this.sendData({
            type: 'move',
            move: move,
            timestamp: Date.now()
        });
    }

    /**
     * Відправляє стан гри
     * @param {Object} gameState - Стан гри
     */
    sendGameState(gameState) {
        this.sendData({
            type: 'game_state',
            state: gameState,
            timestamp: Date.now()
        });
    }

    /**
     * Відправляє повідомлення
     * @param {string} message - Повідомлення
     */
    sendMessage(message) {
        this.sendData({
            type: 'message',
            message: message,
            timestamp: Date.now()
        });
    }

    /**
     * Генерує випадковий ID кімнати
     * @returns {string} ID кімнати
     */
    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Закриває з'єднання
     */
    closeConnection() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
    }

    /**
     * Знищує менеджер
     */
    destroy() {
        this.closeConnection();
        
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        this.roomId = null;
        this.isHost = false;
        this.playerName = '';
        this.onConnectionEstablished = null;
        this.onDataReceived = null;
        this.onConnectionClosed = null;
        this.onError = null;
    }

    /**
     * Отримує статус з'єднання
     * @returns {Object} Статус
     */
    getStatus() {
        return {
            isConnected: this.connection && this.connection.open,
            isHost: this.isHost,
            roomId: this.roomId,
            playerName: this.playerName,
            peerId: this.peer ? this.peer.id : null
        };
    }
}

// Глобальний екземпляр
window.webrtcManager = new WebRTCManager();

// Експорт для модулів
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebRTCManager };
} 