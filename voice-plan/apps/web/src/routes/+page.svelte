<script lang="ts">
  import PlanList from '$lib/components/PlanList.svelte';
  import type { PlanItem } from '@nanolog/db';
  import { onMount } from 'svelte';

  let items: PlanItem[] = $state([]);
  let loading = $state(true);

  async function loadItems() {
    const res = await fetch('/api/plan');
    items = await res.json();
    loading = false;
  }

  async function exportPlan() {
    const res = await fetch('/api/plan/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => {
    loadItems();
    // Poll for updates every 5 seconds (catches Claude Code changes)
    const interval = setInterval(loadItems, 5000);
    return () => clearInterval(interval);
  });
</script>

<div class="max-w-2xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">Action Plan</h1>
    <button
      onclick={exportPlan}
      class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
    >
      Export .md
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else}
    <PlanList bind:items onRefresh={loadItems} />
  {/if}
</div>
