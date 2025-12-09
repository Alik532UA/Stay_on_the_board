// src/lib/services/audioService.ts
/**
 * @file Сервіс для керування аудіо.
 */

import { base } from '$app/paths';
import { logService } from './logService';

let audioInstance: HTMLAudioElement | null = null;

const getAudio = (): HTMLAudioElement | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    if (!audioInstance) {
        audioInstance = new Audio(`${base}/dont-push-the-horses.weba`);
        audioInstance.loop = true;
    }
    return audioInstance;
};

export const audioService = {
    play(): void {
        const audio = getAudio();
        if (audio && audio.paused) {
            audio.currentTime = 0;
            audio.play().catch(e => logService.ui("Audio play failed:", e));
        }
    },

    pause(): void {
        const audio = getAudio();
        if (audio && !audio.paused) {
            audio.pause();
        }
    },

    setVolume(volume: number): void {
        const audio = getAudio();
        if (audio) {
            audio.volume = Math.max(0, Math.min(1, volume));
        }
    },

    loadVolume(): number {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('expertModeVolume');
            return saved !== null ? parseFloat(saved) : 0.3;
        }
        return 0.3;
    },

    saveVolume(volume: number): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('expertModeVolume', String(volume));
        }
    }
};
