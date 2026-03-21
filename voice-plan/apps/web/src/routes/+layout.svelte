<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  let { children } = $props();
</script>

<svelte:head>
  <title>Voice Plan</title>
</svelte:head>

<div class="flex min-h-screen">
  <Nav />
  <main class="flex-1 p-4 md:p-8 pb-20 md:pb-8">
    {@render children()}
  </main>
</div>
