import { modalStore } from '$lib/stores/modalStore';
import { speakText as speak, loadAndGetVoices } from '$lib/services/speechService';
import { logService } from '$lib/services/logService';
import { goto } from '$app/navigation';
import { modalService } from './modalService';

export type SideEffect =
  | { type: 'audio/speak'; payload: any }
  | { type: 'ui/showModal'; payload: any }
  | { type: 'ui/showGameOverModal'; payload: any }
  | { type: 'ui/closeModal' }
  | { type: 'navigation/goto'; payload: { path: string } };


class SideEffectService {
  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      loadAndGetVoices();
    }
  }

  public execute(effect: SideEffect): void {
    logService.logicMove('Executing side effect:', effect.type, 'payload' in effect ? effect.payload : '');
    switch (effect.type) {
      case 'audio/speak':
        this.speakText(effect.payload);
        break;
      case 'ui/showModal':
        this.showModal(effect.payload);
        break;
      case 'ui/showGameOverModal':
        this.showGameOverModal(effect.payload);
        break;
      case 'ui/closeModal':
        this.closeModal();
        break;
      case 'navigation/goto':
        this.navigateTo(effect.payload.path);
        break;
      default:
        const exhaustiveCheck: never = effect;
        logService.ui(`Unknown side effect type: ${exhaustiveCheck}`);
    }
  }

  private speakText(payload: any): void {
    speak(payload.text, payload.lang, payload.voiceURI);
  }

  private showModal(payload: any): void {
    logService.ui('Showing modal:', payload);
    modalStore.showModal(payload);
  }

  private showGameOverModal(payload: any): void {
    logService.ui('Showing game over modal:', payload);
    modalService.showGameOverModal(payload);
  }

  private closeModal(): void {
    modalStore.closeModal();
  }

  public navigateTo(path: string): void {
    goto(path);
  }
}

export const sideEffectService = new SideEffectService();