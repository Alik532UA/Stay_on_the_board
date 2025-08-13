import { modalStore } from '$lib/stores/modalStore';
import { speakText as speak, loadAndGetVoices } from '$lib/services/speechService';
import { logService } from '$lib/services/logService';
import { goto } from '$app/navigation';

export type SideEffect =
  | { type: 'audio/speak'; payload: SpeakEffect }
  | { type: 'ui/showModal'; payload: ModalEffect }
  | { type: 'ui/showGameOverModal'; payload: any }
  | { type: 'ui/closeModal' }
  | { type: 'navigation/goto'; payload: { path: string } };

export interface SpeakEffect {
  text: string;
  lang: string;
  voiceURI: string | null;
}

export interface ModalEffect {
  title?: string;
  titleKey?: string;
  content?: any;
  contentKey?: string;
  buttons?: any[];
  component?: any;
  closable?: boolean;
  dataTestId?: string;
  titleDataTestId?: string;
}

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
    logService.logic('Executing side effect:', effect.type, 'payload' in effect ? effect.payload : '');
    switch (effect.type) {
      case 'audio/speak':
        this.speakText(effect.payload);
        break;
      case 'ui/showModal':
        this.showModal(effect.payload);
        break;
      case 'ui/showGameOverModal':
        // This is handled by modalService now
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

  private speakText(payload: SpeakEffect): void {
    speak(payload.text, payload.lang, payload.voiceURI);
  }

  private showModal(payload: ModalEffect): void {
    logService.ui('Showing modal:', payload);
    modalStore.showModal(payload);
  }

  private closeModal(): void {
    modalStore.closeModal();
  }

  public navigateTo(path: string): void {
    goto(path);
  }
}

export const sideEffectService = new SideEffectService();