// === MODAL COMPONENT ===
// Компонент для модальних вікон з новою архітектурою

import { getState, subscribe, setState } from '../state-manager.js';

export class ModalComponent {
  constructor(element) {
    this.element = element;
    this.unsubscribe = subscribe('ui.modal', () => this.render());
    this.render();
  }

  render() {
    const modal = getState('ui.modal');
    if (!modal || !modal.isOpen) {
      this.element.innerHTML = '';
      this.element.style.display = 'none';
      return;
    }
    this.element.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">${modal.title || ''}</div>
          <div class="modal-body">${modal.content || ''}</div>
          <div class="modal-footer">
            ${(modal.buttons||[]).map((btn,i)=>`<button class="modal-button ${btn.class||''}" data-idx="${i}">${btn.text}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    this.element.style.display = 'block';
    // Прив'язка подій до кнопок
    (modal.buttons||[]).forEach((btn,i)=>{
      this.element.querySelector(`[data-idx="${i}"]`).onclick = ()=>{
        if(btn.onClick) btn.onClick();
        if(btn.close!==false) setState('ui.modal.isOpen', false);
      };
    });
  }

  show(title, content, buttons=[]) {
    setState('ui.modal', { isOpen:true, title, content, buttons });
  }

  hide() {
    setState('ui.modal.isOpen', false);
  }

  destroy() {
    this.unsubscribe && this.unsubscribe();
    this.element.innerHTML = '';
  }
} 