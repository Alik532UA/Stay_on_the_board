
import { tick } from 'svelte';

export function fitTextAction(node: HTMLElement, dependency: any) {
    const buttons = Array.from(
        node.querySelectorAll(".settings-expander__row-btn"),
    ) as HTMLElement[];

    const fit = () => {
        if (buttons.length === 0) return;

        buttons.forEach((btn) => (btn.style.fontSize = ""));

        tick().then(() => {
            const computedStyle = getComputedStyle(buttons[0]);
            const initialFontSize = parseFloat(computedStyle.fontSize);
            let currentFontSize = initialFontSize;

            const fontSizeStep = 0.5;
            while (node.scrollWidth > node.clientWidth && currentFontSize > 12) {
                currentFontSize -= fontSizeStep;
                buttons.forEach(
                    (btn) => (btn.style.fontSize = `${currentFontSize}px`),
                );
            }
        });
    };

    const observer = new ResizeObserver(fit);
    observer.observe(node);

    tick().then(fit);

    return {
        update(newDependency: any) {
            tick().then(fit);
        },
        destroy() {
            observer.disconnect();
        },
    };
}
