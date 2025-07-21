<script lang="ts">
  import { onMount } from 'svelte';

  let left = [
    { id: 'a', label: 'Лівий A' },
    { id: 'b', label: 'Лівий B' },
    { id: 'c', label: 'Лівий C' },
    { id: 'd', label: 'Лівий D' }
  ];
  let right = [
    { id: 'e', label: 'Правий E' },
    { id: 'f', label: 'Правий F' }
  ];

  let dragging: { id: string, label: string } | null = null;
  let dragSource: 'left' | 'right' | null = null;
  let dragX = 0;
  let dragY = 0;
  let isDragging = false;
  let dropTarget: 'left' | 'right' | null = null;
  let dropIndex: number | null = null;

  let leftUl: HTMLUListElement;
  let rightUl: HTMLUListElement;
  let leftLi: any[] = [];
  let rightLi: any[] = [];

  function handlePointerDown(e: PointerEvent, item: { id: string, label: string }, source: 'left' | 'right') {
    dragging = item;
    dragSource = source;
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
    // Визначаємо dropTarget і dropIndex
    if (isDragging) {
      const updateDrop = (ul: HTMLUListElement, target: 'left' | 'right') => {
        const ulRect = ul.getBoundingClientRect();
        if (
          e.clientX >= ulRect.left && e.clientX <= ulRect.right &&
          e.clientY >= ulRect.top && e.clientY <= ulRect.bottom
        ) {
          dropTarget = target;
          let found = false;
          const liArr = Array.from(ul.querySelectorAll('li'));
          for (let i = 0; i < liArr.length; i++) {
            const rect = liArr[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
              dropIndex = i;
              found = true;
              break;
            }
          }
          if (!found) dropIndex = liArr.length; // В кінець
        }
      };
      if (leftUl) updateDrop(leftUl, 'left');
      if (rightUl) updateDrop(rightUl, 'right');
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (isDragging && dragging && dropTarget !== null) {
      handleDrop(dropTarget, dropIndex);
    }
    isDragging = false;
    dragging = null;
    dragSource = null;
    dropTarget = null;
    dropIndex = null;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }

  function handleDrop(target: 'left' | 'right', idx: number | null = null) {
    if (!dragging) return;
    if (dragSource === 'left') {
      left = left.filter(i => i.id !== dragging!.id);
    } else {
      right = right.filter(i => i.id !== dragging!.id);
    }
    if (target === 'left') {
      if (idx === null) left = [...left, dragging];
      else left = [...left.slice(0, idx), dragging, ...left.slice(idx)];
    } else {
      if (idx === null) right = [...right, dragging];
      else right = [...right.slice(0, idx), dragging, ...right.slice(idx)];
    }
  }

  function setLiRef(refs: any[], i: number) {
    return (el: any) => { refs[i] = el; };
  }
</script>

<div style="display: flex; gap: 32px; justify-content: center; margin-top: 32px;">
  <ul
    bind:this={leftUl}
    style="padding: 16px; background: #222; border-radius: 8px; width: 200px; list-style: none; min-height: 80px;"
  >
    <b style="color: #fff;">Лівий блок</b>
    {#each left as item, i (item.id)}
      <li
        style="padding: 12px; margin: 8px 0; background: #444; color: #fff; border-radius: 4px; cursor: grab; opacity: {dragging && dragging.id === item.id ? 0.5 : 1};"
        on:pointerdown={(e) => handlePointerDown(e, item, 'left')}
      >
        {item.label}
      </li>
    {/each}
  </ul>
  <ul
    bind:this={rightUl}
    style="padding: 16px; background: #222; border-radius: 8px; width: 200px; list-style: none; min-height: 80px;"
  >
    <b style="color: #fff;">Правий блок</b>
    {#each right as item, i (item.id)}
      <li
        style="padding: 12px; margin: 8px 0; background: #444; color: #fff; border-radius: 4px; cursor: grab; opacity: {dragging && dragging.id === item.id ? 0.5 : 1};"
        on:pointerdown={(e) => handlePointerDown(e, item, 'right')}
      >
        {item.label}
      </li>
    {/each}
  </ul>
</div>

{#if isDragging && dragging}
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