import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { logService } from './logService';

type HotkeyAction = {
    action: (event?: KeyboardEvent) => void;
    condition?: () => boolean;
};

const contextStack = writable<string[]>(['global']);
const hotkeyRegistry = new Map<string, Map<string, HotkeyAction>>();

function handleKeydown(event: KeyboardEvent) {
    // 1. Перевірка на фокус в полях вводу (Global Input Protection)
    const target = event.target as HTMLElement;
    const isInputActive =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

    if (isInputActive && event.code !== 'Escape') {
        return;
    }

    const stack = get(contextStack);
    // Використовуємо hotkey лог для дебагу натискань
    logService.hotkey(`[hotkeyService] handleKeydown: code=${event.code}, stack=`, stack);

    for (let i = stack.length - 1; i >= 0; i--) {
        const context = stack[i];
        const contextHotkeys = hotkeyRegistry.get(context);

        if (contextHotkeys) {
            const hotkey = contextHotkeys.get(event.code);
            if (hotkey && (!hotkey.condition || hotkey.condition())) {
                // Тут залишаємо ACTION, бо це реальна дія користувача, яка спрацювала
                logService.action(`[hotkeyService] Executing hotkey '${event.code}' from context '${context}'`);
                event.preventDefault();
                event.stopPropagation();
                hotkey.action(event);
                return;
            }
        }
    }
    logService.hotkey(`[hotkeyService] No action found for key '${event.code}' in any active context.`);
}

function setup() {
    if (typeof window !== 'undefined') {
        logService.init('[hotkeyService] Setting up global keydown listener.');
        window.addEventListener('keydown', handleKeydown, true);
    }
}

function registerHotkey(context: string, key: string, action: (event?: KeyboardEvent) => void, condition?: () => boolean) {
    if (!hotkeyRegistry.has(context)) {
        hotkeyRegistry.set(context, new Map());
    }
    // Змінено на hotkey
    logService.hotkey(`[hotkeyService] Registering hotkey '${key}' for context '${context}'`);
    hotkeyRegistry.get(context)!.set(key, { action, condition });
}

function unregisterContext(context: string) {
    // Змінено на hotkey
    logService.hotkey(`[hotkeyService] Unregistering all hotkeys for context '${context}'`);
    hotkeyRegistry.delete(context);
}

function pushContext(context: string) {
    // Змінено на hotkey
    logService.hotkey(`[hotkeyService] Pushing new context: '${context}'`);
    contextStack.update(stack => [...stack, context]);
}

function popContext(context?: string) {
    contextStack.update(stack => {
        if (stack.length > 1) {
            const topOfStack = stack[stack.length - 1];
            if (context && context !== topOfStack) {
                logService.hotkey(`[hotkeyService] Tried to pop context '${context}' but '${topOfStack}' is on top. Aborting.`);
                return stack;
            }
            const newStack = [...stack];
            const poppedContext = newStack.pop()!;
            logService.hotkey(`[hotkeyService] Popping context: '${poppedContext}'`);
            unregisterContext(poppedContext);
            return newStack;
        }
        return stack;
    });
}

function getCurrentContext() {
    const stack = get(contextStack);
    return stack[stack.length - 1];
}

setup();

const hotkeyService = {
    register: registerHotkey,
    unregister: unregisterContext,
    pushContext,
    popContext,
    getCurrentContext,
    get a() {
        return get(contextStack);
    }
};

export default hotkeyService;