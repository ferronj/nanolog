<script lang="ts">
  import type { PlanItem } from '@voice-plan/db';

  let { item, onStatusChange, onDelete }: {
    item: PlanItem;
    onStatusChange: (id: string, status: string) => void;
    onDelete: (id: string) => void;
  } = $props();

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
  };

  const effortLabels: Record<string, string> = {
    small: 'S',
    medium: 'M',
    large: 'L',
  };

  function toggleStatus() {
    const next = item.status === 'done' ? 'todo' : 'done';
    onStatusChange(item.id, next);
  }
</script>

<div class="group flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-grab active:cursor-grabbing">
  <button
    onclick={toggleStatus}
    class="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
      {item.status === 'done'
        ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
        : 'border-[var(--color-text-muted)] hover:border-[var(--color-accent)]'}"
    aria-label="Toggle task status"
  >
    {#if item.status === 'done'}
      <span class="text-xs">✓</span>
    {/if}
  </button>

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2 flex-wrap">
      <span
        class="font-medium {item.status === 'done' ? 'line-through text-[var(--color-text-muted)]' : ''}"
      >
        {item.description}
      </span>
      {#if item.status === 'in_progress'}
        <span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
          In Progress
        </span>
      {/if}
    </div>

    <div class="flex items-center gap-2 mt-1">
      <span class="inline-block w-2 h-2 rounded-full {priorityColors[item.priority]}"></span>
      <span class="text-xs text-[var(--color-text-muted)]">{item.priority}</span>
      <span class="text-xs px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-text-muted)]">
        {effortLabels[item.effort]}
      </span>
      {#if item.result}
        <span class="text-xs text-[var(--color-text-muted)] truncate ml-2">
          → {item.result}
        </span>
      {/if}
    </div>
  </div>

  <button
    onclick={() => onDelete(item.id)}
    class="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-red-400 transition-all text-sm px-1"
    aria-label="Delete task"
  >
    ✕
  </button>
</div>
