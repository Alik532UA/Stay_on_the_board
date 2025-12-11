// src/lib/services/SideEffectService.ts
import { navigationService } from './navigationService';
import { speakText, speakMove } from './speechService';
import { modalService } from './modalService';
import { gameEventBus } from './gameEventBus';
import { logService } from './logService';
import type { MoveDirectionType } from '$lib/models/Piece';
import type { GameOverPayload } from '$lib/stores/gameOverStore';
import type { ModalState } from '$lib/stores/modalStore';

export type SideEffect =
  | { type: 'navigate'; payload: string }
  | { type: 'speak'; payload: { text: string; lang: string; voiceURI: string | null } }
  | { type: 'speak_move'; payload: { move: { direction: MoveDirectionType; distance: number }; lang: string; voiceURI: string | null, onEndCallback?: () => void, force?: boolean } }
  | { type: 'localStorage_set'; payload: { key: string; value: unknown } }
  | { type: 'ui/showGameOverModal'; payload: GameOverPayload }
  | { type: 'ui/closeModal' }
  | { type: 'ui/showModal'; payload: Partial<ModalState> & { dataTestId: string } }
  | { type: 'audio/speak'; payload: { text: string; lang: string; voiceURI: string | null } };

class SideEffectService {
  public execute(effect: SideEffect): void {
    switch (effect.type) {
      case 'navigate':
        navigationService.goTo(effect.payload);
        break;
      case 'speak':
        speakText(effect.payload.text, effect.payload.lang, effect.payload.voiceURI);
        break;
      case 'speak_move':
        logService.speech('[SideEffectService] Received speak_move effect', effect.payload);
        // FIX: Передаємо параметр force
        speakMove(
          effect.payload.move,
          effect.payload.lang,
          effect.payload.voiceURI,
          effect.payload.onEndCallback,
          effect.payload.force
        );
        break;
      case 'localStorage_set':
        localStorage.setItem(effect.payload.key, JSON.stringify(effect.payload.value));
        break;
      case 'ui/showGameOverModal':
        modalService.showGameOverModal(effect.payload);
        break;
      case 'ui/closeModal':
        modalService.closeModal();
        break;
      case 'ui/showModal':
        modalService.showModal(effect.payload);
        break;
      case 'audio/speak':
        speakText(effect.payload.text, effect.payload.lang, effect.payload.voiceURI);
        break;
    }
  }
}

export const sideEffectService = new SideEffectService();