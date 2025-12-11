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
    const stack = get(contextStack);
    // Використовуємо event.code для надійної ідентифікації клавіш
    logService.action(`[hotkeyService] handleKeydown: code=${event.code}, stack=`, stack);

    for (let i = stack.length - 1; i >= 0; i--) {
        const context = stack[i];
        const contextHotkeys = hotkeyRegistry.get(context);

        if (contextHotkeys) {
            const hotkey = contextHotkeys.get(event.code); // ЗМІНЕНО: з event.key на event.code
            if (hotkey && (!hotkey.condition || hotkey.condition())) {
                logService.action(`[hotkeyService] Executing hotkey '${event.code}' from context '${context}'`);
                event.preventDefault();
                event.stopPropagation();
                hotkey.action(event);
                // Stop after finding and executing the first matching hotkey
                return;
            }
        }
    }
    logService.action(`[hotkeyService] No action found for key '${event.code}' in any active context.`);
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
    logService.action(`[hotkeyService] Registering hotkey '${key}' for context '${context}'`);
    hotkeyRegistry.get(context)!.set(key, { action, condition });
}

function unregisterContext(context: string) {
    logService.action(`[hotkeyService] Unregistering all hotkeys for context '${context}'`);
    hotkeyRegistry.delete(context);
}

function pushContext(context: string) {
    logService.action(`[hotkeyService] Pushing new context: '${context}'`);
    contextStack.update(stack => [...stack, context]);
}

function popContext(context?: string) {
    contextStack.update(stack => {
        if (stack.length > 1) {
            const topOfStack = stack[stack.length - 1];
            // If a context is provided, only pop if it's the one on top.
            if (context && context !== topOfStack) {
                logService.action(`[hotkeyService] Tried to pop context '${context}' but '${topOfStack}' is on top. Aborting.`);
                return stack;
            }
            const newStack = [...stack];
            const poppedContext = newStack.pop()!;
            logService.action(`[hotkeyService] Popping context: '${poppedContext}'`);
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

// Immediately activate the service when the module is imported
setup();

const hotkeyService = {
    register: registerHotkey,
    unregister: unregisterContext,
    pushContext,
    popContext,
    getCurrentContext, // Added this
    get a() { // For debugging
        return get(contextStack);
    }
};

export default hotkeyService;
