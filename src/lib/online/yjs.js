import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

// Створення Yjs документа
export const ydoc = new Y.Doc();

// Підключення до кімнати через WebRTC
export function connectYjsRoom(roomName = 'default-room') {
  // Можна додати опції: signaling, password, etc.
  return new WebrtcProvider(roomName, ydoc);
}

// Приклад використання:
// import { ydoc, connectYjsRoom } from '$lib/online/yjs';
// const provider = connectYjsRoom('game-room-123');
// const ymap = ydoc.getMap('game');
// ymap.set('move', ...); 