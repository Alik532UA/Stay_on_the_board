import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseService';

export interface ChatMessage {
    id?: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: number;
}

class ChatService {
    private get db() {
        return getFirestoreDb();
    }

    async sendMessage(roomId: string, senderId: string, senderName: string, text: string): Promise<void> {
        const messagesRef = collection(this.db, 'rooms', roomId, 'messages');
        await addDoc(messagesRef, {
            senderId,
            senderName,
            text,
            createdAt: serverTimestamp()
        });
    }

    subscribeToChat(roomId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
        const messagesRef = collection(this.db, 'rooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));

        return onSnapshot(q, (snapshot) => {
            const messages: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                messages.push({
                    id: doc.id,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    text: data.text,
                    createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now()
                });
            });
            callback(messages);
        });
    }
}

export const chatService = new ChatService();