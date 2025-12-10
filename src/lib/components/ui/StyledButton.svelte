<script lang="ts">
  import "$lib/css/components/styled-button.css";
  import { createEventDispatcher } from "svelte";

  import { customTooltip } from "$lib/actions/customTooltip.js";

  // HTMLButtonElement attributes we want to expose
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled: boolean = false;
  export let title: string | undefined = undefined;
  export let id: string | undefined = undefined;

  /**
   * Optional tooltip text.
   */
  export let tooltip: string | undefined = undefined;

  /**
   * The visual style variant of the button.
   * - `default`: White background, generic modal button.
   * - `menu`: Uses --control-bg, for Main Menu.
   * - `primary`: Green (Confirm).
   * - `info`: Blue (Info).
   * - `danger`: Red (Error/Delete).
   */
  export let variant: "default" | "menu" | "primary" | "info" | "danger" =
    "default";

  /**
   * The size of the button.
   * - `default`: Standard modal button size.
   * - `large`: Main Menu button size.
   * - `small`: Compact size.
   */
  export let size: "default" | "large" | "small" = "default";

  /**
   * The shape of the button.
   * - `default`: Standard rounded rectangle.
   * - `circle`: Perfect circle (for icons).
   */
  export let shape: "default" | "circle" = "default";

  /**
   * Optional custom CSS class to append.
   */
  let customClass = "";
  export { customClass as class };

  /**
   * Optional inline styles.
   */
  export let style: string | undefined = undefined;

  /**
   * Data test id for testing
   */
  export let dataTestId: string | undefined = undefined;

  /**
   * Binding to the underlying HTMLButtonElement
   */
  export let buttonElement: HTMLButtonElement | null = null;

  const dispatch = createEventDispatcher();

  function handleClick(event: MouseEvent) {
    if (!disabled) {
      dispatch("click", event);
    }
  }
</script>

<button
  {type}
  class="styled-button styled-button--variant-{variant} styled-button--size-{size} styled-button--shape-{shape} {customClass}"
  {style}
  {disabled}
  {title}
  {id}
  data-testid={dataTestId}
  bind:this={buttonElement}
  on:click={handleClick}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  use:customTooltip={tooltip}
>
  <slot name="icon" />
  <slot />
</button>
