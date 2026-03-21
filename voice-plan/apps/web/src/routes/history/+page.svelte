<script lang="ts">
  import { onMount } from 'svelte';

  let snapshots: { id: string; planJson: string; createdAt: string }[] = $state([]);
  let loading = $state(true);

  async function loadSnapshots() {
    const res = await fetch('/api/snapshots?limit=20');
    snapshots = await res.json();
    loading = false;
  }

  function formatDate(dt: string): string {
    return new Date(dt + 'Z').toLocaleString();
  }

  function countItems(json: string): number {
    try {
      return JSON.parse(json).length;
    } catch {
      return 0;
    }
  }

  onMount(loadSnapshots);
</script>

<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">History</h1>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if snapshots.length === 0}
    <p class="text-[var(--color-text-muted)] text-center py-12">
      No snapshots yet. Snapshots are created automatically when the plan is updated.
    </p>
  {:else}
    <div class="space-y-2">
      {#each snapshots as snapshot}
        <div class="bg-[var(--color-surface)] rounded-lg p-4 flex items-center justify-between">
          <div>
            <span class="text-sm font-medium">{formatDate(snapshot.createdAt)}</span>
            <span class="text-xs text-[var(--color-text-muted)] ml-2">
              {countItems(snapshot.planJson)} items
            </span>
          </div>
          <span class="text-xs text-[var(--color-text-muted)] font-mono">{snapshot.id}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
