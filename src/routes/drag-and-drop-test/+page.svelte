<script lang="ts">
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import DraggableColumns from '$lib/components/DraggableColumns.svelte';

  type DndItem = { id: string; label: string };
  type DndColumn = { id: string; label: string; items: DndItem[] };

  let columns: DndColumn[] = [
    {
      id: 'left',
      label: 'Лівий блок',
      items: [
        { id: 'a', label: 'Лівий A' },
        { id: 'b', label: 'Лівий B' },
        { id: 'c', label: 'Лівий C' },
        { id: 'd', label: 'Лівий D' }
      ]
    },
    {
      id: 'right',
      label: 'Правий блок',
      items: [
        { id: 'e', label: 'Правий E' },
        { id: 'f', label: 'Правий F' }
      ]
    }
  ];

  function handleDrop(event: CustomEvent<{ dragging: DndItem; dragSourceCol: string; dropTargetCol: string; dropIndex: number }>) {
    const { dragging, dragSourceCol, dropTargetCol, dropIndex } = event.detail;
    if (!dragSourceCol || !dropTargetCol) return;
    // Копіюємо масиви для реактивності
    let newColumns = columns.map(col => ({ ...col, items: [...col.items] }));
    // Видаляємо з джерела
    const sourceCol = newColumns.find(col => col.id === dragSourceCol);
    if (!sourceCol) return;
    const itemIdx = sourceCol.items.findIndex(i => i.id === dragging.id);
    if (itemIdx === -1) return;
    const [item] = sourceCol.items.splice(itemIdx, 1);
    // Додаємо у ціль
    const targetCol = newColumns.find(col => col.id === dropTargetCol);
    if (!targetCol) return;
    targetCol.items.splice(dropIndex, 0, item);
    columns = newColumns;
  }
</script>

<FloatingBackButton />

<h1 class="page-title">Test Drag and Drop</h1>

<DraggableColumns {columns} on:drop={handleDrop} />

<style>
  .page-title {
    text-align: center;
    margin-top: 18px;
    color: #fff;
    font-size: 2em;
    font-weight: bold;
  }
</style> 