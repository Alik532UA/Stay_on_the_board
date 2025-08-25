// src/lib/services/SideEffectService.ts
import { navigationService } from './navigationService';
import { speakText } from './speechService';
import { modalService } from './modalService';
import { gameEventBus } from './gameEventBus';

export type SideEffect =
  | { type: 'navigate'; payload: string }
  | { type: 'speak'; payload: { text: string; lang: string; voiceURI: string | null } }
  | { type: 'localStorage_set'; payload: { key: string; value: any } }
  | { type: 'ui/showGameOverModal'; payload: any }
  | { type: 'ui/closeModal' }
  | { type: 'ui/showModal'; payload: any }
  | { type: 'audio/speak'; payload: any };

class SideEffectService {
  public execute(effect: SideEffect): void {
    switch (effect.type) {
      case 'navigate':
        navigationService.goTo(effect.payload);
        break;
      case 'speak':
        speakText(effect.payload.text, effect.payload.lang, effect.payload.voiceURI);
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