<script lang="ts">
  import { page } from '$app/state';

  const links = [
    { href: '/', label: 'Plan', icon: '📋' },
    { href: '/record', label: 'Record', icon: '🎙️' },
    { href: '/history', label: 'History', icon: '📜' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];
</script>

<!-- Desktop sidebar -->
<nav class="hidden md:flex flex-col w-56 bg-[var(--color-surface)] border-r border-[var(--color-border)] h-screen sticky top-0">
  <div class="p-4 border-b border-[var(--color-border)]">
    <h1 class="text-lg font-bold text-[var(--color-accent)]">Voice Plan</h1>
  </div>
  <div class="flex flex-col gap-1 p-2">
    {#each links as { href, label, icon }}
      <a
        {href}
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
          {page.url.pathname === href
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'}"
      >
        <span>{icon}</span>
        <span>{label}</span>
      </a>
    {/each}
  </div>
</nav>

<!-- Mobile bottom nav -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-50">
  <div class="flex justify-around py-2">
    {#each links as { href, label, icon }}
      <a
        {href}
        class="flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors
          {page.url.pathname === href
            ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-text-muted)]'}"
      >
        <span class="text-xl">{icon}</span>
        <span>{label}</span>
      </a>
    {/each}
  </div>
</nav>
