import {
    collection,
    setDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDoc,
    updateDoc,
    onSnapshot,
    type Unsubscribe,
    type DocumentData,
    type QuerySnapshot
} from 'firebase/firestore';
import { getFirestoreDb } from '../firebaseService';
import type { Room } from '$lib/types/online';
import { withTimeout } from '$lib/utils/asyncUtils';

const OPERATION_TIMEOUT_MS = 10000;

class RoomFirestoreService {
    private get db() {
        return getFirestoreDb();
    }

    private getRoomRef(roomId: string) {
        return doc(this.db, 'rooms', roomId);
    }

    async createRoomDoc(roomId: string, roomData: any): Promise<void> {
        await withTimeout(
            setDoc(this.getRoomRef(roomId), roomData),
            OPERATION_TIMEOUT_MS,
            'Timeout: Failed to connect to Firebase Firestore.'
        );
    }

    async getStatsDoc(): Promise<any> {
        const statsRef = doc(this.db, 'general', 'stats');
        const snap = await getDoc(statsRef);
        return snap.exists() ? snap.data() : null;
    }

    async updateStatsDoc(data: any): Promise<void> {
        const statsRef = doc(this.db, 'general', 'stats');
        await setDoc(statsRef, data, { merge: true });
    }

    async getPublicRoomsQuerySnapshot(): Promise<[QuerySnapshot<DocumentData>, any]> {
        const q = query(
            collection(this.db, 'rooms'),
            where('isPrivate', '==', false),
            orderBy('lastActivity', 'desc')
        );

        const [querySnapshot, statsData] = await Promise.all([
            withTimeout(getDocs(q), OPERATION_TIMEOUT_MS, 'Timeout fetching rooms'),
            this.getStatsDoc().catch((): null => null)
        ]);

        return [querySnapshot, statsData];
    }

    async deleteRoomDoc(ref: any): Promise<void> {
        await deleteDoc(ref);
    }

    async getRoomDoc(roomId: string): Promise<Room | null> {
        const roomSnap = await withTimeout(
            getDoc(this.getRoomRef(roomId)),
            OPERATION_TIMEOUT_MS,
            'Timeout connecting to room'
        );
        if (roomSnap.exists()) {
            return { ...roomSnap.data(), id: roomSnap.id } as Room;
        }
        return null;
    }

    // Спрощена версія без таймауту для простих перевірок
    async getRoomDocSimple(roomId: string): Promise<Room | null> {
        const roomSnap = await getDoc(this.getRoomRef(roomId));
        if (roomSnap.exists()) {
            return { ...roomSnap.data(), id: roomSnap.id } as Room;
        }
        return null;
    }

    async updateRoomDoc(roomId: string, updates: any, useTimeout: boolean = false): Promise<void> {
        const promise = updateDoc(this.getRoomRef(roomId), updates);
        if (useTimeout) {
            await withTimeout(promise, OPERATION_TIMEOUT_MS, 'Timeout updating room');
        } else {
            await promise;
        }
    }

    subscribeToRoom(roomId: string, callback: (room: Room | null) => void, errorCallback: (error: any) => void): Unsubscribe {
        return onSnapshot(
            this.getRoomRef(roomId),
            (doc) => {
                if (doc.exists()) {
                    callback({ ...doc.data(), id: doc.id } as Room);
                } else {
                    callback(null);
                }
            },
            errorCallback
        );
    }
}

export const roomFirestoreService = new RoomFirestoreService();
