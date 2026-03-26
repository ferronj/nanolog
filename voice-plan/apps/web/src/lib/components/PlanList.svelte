<script lang="ts">
  import type { PlanItem as PlanItemType } from '@nanolog/db';
  import PlanItem from './PlanItem.svelte';
  import { onMount } from 'svelte';

  let { items = $bindable([]), onRefresh }: {
    items: PlanItemType[];
    onRefresh: () => void;
  } = $props();

  let newTaskDescription = $state('');

  const inProgress = $derived(items.filter(i => i.status === 'in_progress'));
  const todo = $derived(items.filter(i => i.status === 'todo'));
  const done = $derived(items.filter(i => i.status === 'done'));

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/plan/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/plan/${id}`, { method: 'DELETE' });
    onRefresh();
  }

  async function addTask() {
    if (!newTaskDescription.trim()) return;
    await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newTaskDescription.trim() }),
    });
    newTaskDescription = '';
    onRefresh();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') addTask();
  }
</script>

<div class="space-y-6">
  <!-- Add task input -->
  <div class="flex gap-2">
    <input
      type="text"
      placeholder="Add a task..."
      bind:value={newTaskDescription}
      onkeydown={handleKeydown}
      class="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
    />
    <button
      onclick={addTask}
      class="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors"
    >
      Add
    </button>
  </div>

  <!-- In Progress -->
  {#if inProgress.length > 0}
    <section>
      <h2 class="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">
        In Progress ({inProgress.length})
      </h2>
      <div class="space-y-2">
        {#each inProgress as item (item.id)}
          <PlanItem {item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- To Do -->
  <section>
    <h2 class="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
      To Do ({todo.length})
    </h2>
    <div class="space-y-2">
      {#each todo as item (item.id)}
        <PlanItem {item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      {/each}
      {#if todo.length === 0}
        <p class="text-sm text-[var(--color-text-muted)] italic py-4 text-center">
          No pending tasks. Record a voice note to add some!
        </p>
      {/if}
    </div>
  </section>

  <!-- Done -->
  {#if done.length > 0}
    <section>
      <h2 class="text-sm font-semibold text-green-400 uppercase tracking-wider mb-2">
        Done ({done.length})
      </h2>
      <div class="space-y-2">
        {#each done as item (item.id)}
          <PlanItem {item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        {/each}
      </div>
    </section>
  {/if}
</div>
