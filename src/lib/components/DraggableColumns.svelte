<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { slide } from 'svelte/transition';
  import { columnStyleMode } from '$lib/stores/columnStyleStore.js';
  import { _ } from 'svelte-i18n';
  import { layoutUpdateStore } from '$lib/stores/layoutUpdateStore.js';

  export let columns: { id: string, label: string, items: { id: string, label: string, props?: any }[] }[];
  export let itemContent: (item: any) => any = item => item.label;
  export let class_name = '';

  const dispatch = createEventDispatcher();

  let dragging: { id: string, label: string } | null = null;
  let dragSourceCol: string | null = null;
  let dragX = 0;
  let dragY = 0;
  let isDragging = false;
  let dropTargetCol: string | null = null;
  let dropIndex: number | null = null;
  let colRefs: HTMLUListElement[] = [];
  let isHorizontalLayout = true;
  let containerRef: HTMLDivElement;
  let marginTop = '0';

  function updateLayoutMode() {
    isHorizontalLayout = window.innerWidth > 1270;
    tick().then(() => {
      if (isHorizontalLayout && containerRef) {
        const contentHeight = containerRef.offsetHeight;
        const windowHeight = window.innerHeight;
        if (contentHeight < windowHeight) {
          marginTop = `${(windowHeight - contentHeight) / 2}px`;
        } else {
          marginTop = '2vh';
        }
      } else {
        marginTop = '0';
      }
    });
  }

  onMount(() => {
    window.addEventListener('resize', updateLayoutMode);
    return () => window.removeEventListener('resize', updateLayoutMode);
  });

  $: $layoutUpdateStore, updateLayoutMode();

  function handlePointerDown(e: PointerEvent, item: { id: string, label: string }, colId: string) {
    dragging = item;
    dragSourceCol = colId;
    isDragging = true;
    dragX = e.clientX;
    dragY = e.clientY;
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handlePointerMove(e: PointerEvent) {
    dragX = e.clientX;
    dragY = e.clientY;
    if (isDragging) {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const ul = colRefs[i];
        if (!ul) continue;
        const ulRect = ul.getBoundingClientRect();
        if (
          e.clientX >= ulRect.left && e.clientX <= ulRect.right &&
          e.clientY >= ulRect.top && e.clientY <= ulRect.bottom
        ) {
          dropTargetCol = col.id;
          let found = false;
          const liArr = Array.from(ul.querySelectorAll('li'));
          for (let j = 0; j < liArr.length; j++) {
            const rect = liArr[j].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
              dropIndex = j;
              found = true;
              break;
            }
          }
          if (!found) dropIndex = liArr.length;
        }
      }
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (isDragging && dragging && dropTargetCol !== null) {
      dispatch('drop', { dragging, dragSourceCol, dropTargetCol, dropIndex });
    }
    isDragging = false;
    dragging = null;
    dragSourceCol = null;
    dropTargetCol = null;
    dropIndex = null;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }
</script>

<style>
  .dnd-columns-container {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 0;
    flex-direction: row;
    transition: gap 0.6s cubic-bezier(0.4,0,0.2,1), padding 0.6s cubic-bezier(0.4,0,0.2,1), margin 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  @media (max-width: 1270px) {
    .dnd-columns-container {
      flex-direction: column;
      align-items: center;
    }
  }
  ul:not(.editing-column) {
    background: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  ul:not(.editing-column) li {
    background: none !important;
    color: #fff;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  ul:not(.editing-column) b {
    display: none !important;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 400px;
    max-width: 100vw;
    min-width: 0;
    box-sizing: border-box;
  }
  @media (max-width: 600px) {
    ul {
      width: 95vw !important;
      max-width: 100vw !important;
      min-width: 0 !important;
      box-sizing: border-box;
    }
  }
  ul li {
    background: none !important;
    color: #fff;
    /* border: none !important; */
    padding: 0 !important;
    margin: 4px !important;
  }
  ul.editing-column {
    background: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: 2px dashed #888;
    display: flex;
    flex-direction: column;
    gap: 0px;
  }
  ul.editing-column b {
    display: none !important;
  }
  ul.editing-column li {
    border: 1.5px dashed #888;
  }
  .dnd-edit-instruction {
    max-width: 300px;
    min-width: 220px;
    word-break: break-word;
    white-space: pre-line;
    padding: 14px 18px;
    font-size: 1.08em;
    background: #666;
    color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px #0008;
    opacity: 0.92;
    pointer-events: none;
  }
</style>

<div bind:this={containerRef} class="dnd-columns-container {class_name}" style="margin-top: {marginTop};" data-testid="game-widgets-container">
  {#each columns as col, i}
    <ul
      bind:this={colRefs[i]}
      class="dnd-column"
      data-testid="dnd-column-{col.id}"
      class:editing-column={$columnStyleMode === 'editing'}
      style={$columnStyleMode === 'editing'
        ? 'padding: 0; background: none; border-radius: 8px; list-style: none; min-height: 80px;'
        : 'padding: 16px; background: #222; border-radius: 8px; list-style: none; min-height: 80px;'}
      transition:slide={{ duration: 500 }}
    >
      {#if $columnStyleMode !== 'editing'}
        <b class="dnd-column-header" style="color: #fff;">{col.label}</b>
      {/if}
      {#each col.items as item, j (item.id)}
        <li
          data-testid="widget-{item.id}"
          class="dnd-item"
          style="padding: 12px; margin: 8px 0; background: none; color: #fff; border-radius: 4px; {($columnStyleMode === 'editing') ? 'cursor: grab;' : 'cursor: default;'} opacity: {dragging && dragging.id === item.id ? 0.5 : 1};"
          on:pointerdown={($columnStyleMode === 'editing') ? (e) => handlePointerDown(e, item, col.id) : undefined}
          transition:slide={{ duration: 500 }}
        >
          <div class="dnd-item-content">
            {#if typeof itemContent(item) === 'function'}
              <svelte:component this={itemContent(item)} {...item.props} />
            {:else}
              {itemContent(item)}
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/each}
</div>

{#if isDragging && dragging && $columnStyleMode === 'editing'}
  <div
    class="dnd-edit-instruction"
    style="
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 9999;
      transform: translate({dragX}px, {dragY}px) scale(1.05);
    "
  >
    {$_('ui.dndEditInstruction')}
  </div>
{/if} 
