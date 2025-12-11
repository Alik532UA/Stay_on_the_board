/**
 * Action для зміни числових значень перетягуванням миші (Scrubbing).
 */
export function scrubbable(
    node: HTMLElement,
    params: {
        value: number;
        min: number;
        max: number;
        step: number;
        onInput: (val: number) => void;   // Локальне оновлення (швидке)
        onChange: (val: number) => void;  // Відправка на сервер (повільне)
        disabled: boolean;
    }
) {
    let { value, min, max, step, onInput, onChange, disabled } = params;
    let startX = 0;
    let startValue = 0;
    let currentValue = value;

    function onMouseDown(e: MouseEvent) {
        if (disabled) return;
        e.preventDefault();
        startX = e.clientX;
        startValue = value;
        currentValue = value;

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "ew-resize";
        node.classList.add("scrubbing");
    }

    function onMouseMove(e: MouseEvent) {
        const deltaX = e.clientX - startX;
        const deltaValue = Math.round(deltaX / step);
        let newValue = startValue + deltaValue;
        newValue = Math.max(min, Math.min(max, newValue));

        if (newValue !== currentValue) {
            currentValue = newValue;
            onInput(currentValue);
        }
    }

    function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        node.classList.remove("scrubbing");

        if (currentValue !== startValue) {
            onChange(currentValue);
        }
    }

    node.addEventListener("mousedown", onMouseDown);

    return {
        update(newParams: typeof params) {
            value = newParams.value;
            min = newParams.min;
            max = newParams.max;
            step = newParams.step;
            onInput = newParams.onInput;
            onChange = newParams.onChange;
            disabled = newParams.disabled;
        },
        destroy() {
            node.removeEventListener("mousedown", onMouseDown);
        },
    };
}