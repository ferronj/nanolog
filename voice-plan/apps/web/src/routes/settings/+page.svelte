<script lang="ts">
  // Settings are managed via environment variables in Docker.
  // This page shows the current configuration status.
</script>

<div class="max-w-xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Settings</h1>

  <div class="space-y-4">
    <div class="bg-[var(--color-surface)] rounded-lg p-4">
      <h2 class="font-medium mb-3">API Configuration</h2>
      <p class="text-sm text-[var(--color-text-muted)] mb-4">
        API keys are configured via environment variables in your Docker deployment.
        They are never stored in the browser.
      </p>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
          <span>OpenAI API Key</span>
          <span class="text-[var(--color-text-muted)]">OPENAI_API_KEY</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
          <span>Anthropic API Key</span>
          <span class="text-[var(--color-text-muted)]">ANTHROPIC_API_KEY</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span>Database</span>
          <span class="text-[var(--color-text-muted)]">DATABASE_URL</span>
        </div>
      </div>
    </div>

    <div class="bg-[var(--color-surface)] rounded-lg p-4">
      <h2 class="font-medium mb-3">MCP Server (Local)</h2>
      <p class="text-sm text-[var(--color-text-muted)] mb-3">
        To connect Claude Code to your plan database, point the MCP server at the same SQLite file:
      </p>
      <pre class="bg-[var(--color-bg)] rounded p-3 text-xs overflow-x-auto"><code>claude mcp add nanolog \
  -e DATABASE_URL=file:/path/to/nanolog.db \
  -- node ./voice-plan/mcp-server/dist/index.js</code></pre>
    </div>

    <div class="bg-[var(--color-surface)] rounded-lg p-4">
      <h2 class="font-medium mb-3">About</h2>
      <p class="text-sm text-[var(--color-text-muted)]">
        Nanolog is a voice-driven productivity system. Record your thoughts,
        and AI turns them into an actionable plan. Claude Code executes tasks
        via the MCP server.
      </p>
    </div>
  </div>
</div>
