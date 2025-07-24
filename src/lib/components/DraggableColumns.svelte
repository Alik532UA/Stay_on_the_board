<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { slide } from 'svelte/transition';
  import { columnStyleMode } from '$lib/stores/columnStyleStore.js';

  export let columns: { id: string, label: string, items: { id: string, label: string }[] }[];
  export let itemContent: (item: any) => any = item => item.label;

  const dispatch = createEventDispatcher();

  let dragging: { id: string, label: string } | null = null;
  let dragSourceCol: string | null = null;
  let dragX = 0;
  let dragY = 0;
  let isDragging = false;
  let dropTargetCol: string | null = null;
  let dropIndex: number | null = null;
  let colRefs: HTMLUListElement[] = [];

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
</style>

<div class="dnd-columns-container">
  {#each columns as col, i}
    <ul
      bind:this={colRefs[i]}
      class:editing-column={$columnStyleMode === 'editing'}
      style={$columnStyleMode === 'editing'
        ? 'padding: 0; background: none; border-radius: 8px; width: 400px; list-style: none; min-height: 80px;'
        : 'padding: 16px; background: #222; border-radius: 8px; width: 400px; list-style: none; min-height: 80px;'}
      transition:slide={{ duration: 500 }}
    >
      {#if $columnStyleMode !== 'editing'}
        <b style="color: #fff;">{col.label}</b>
      {/if}
      {#each col.items as item, j (item.id)}
        <li
          style="padding: 12px; margin: 8px 0; background: none; color: #fff; border-radius: 4px; {($columnStyleMode === 'editing') ? 'cursor: grab;' : 'cursor: default;'} opacity: {dragging && dragging.id === item.id ? 0.5 : 1};"
          on:pointerdown={($columnStyleMode === 'editing') ? (e) => handlePointerDown(e, item, col.id) : undefined}
          transition:slide={{ duration: 500 }}
        >
          {#if typeof itemContent(item) === 'function'}
            <svelte:component this={itemContent(item)} />
          {:else}
            {itemContent(item)}
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
</div>

{#if isDragging && dragging && $columnStyleMode === 'editing'}
  <div
    style="
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 9999;
      transform: translate({dragX}px, {dragY}px) scale(1.05);
      background: #666;
      color: #fff;
      padding: 12px 24px;
      border-radius: 6px;
      box-shadow: 0 4px 16px #0008;
      opacity: 0.85;
      font-size: 1.1em;
    "
  >
    {dragging.label}
  </div>
{/if} 