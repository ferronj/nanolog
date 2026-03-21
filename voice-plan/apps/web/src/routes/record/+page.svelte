<script lang="ts">
  import RecordButton from '$lib/components/RecordButton.svelte';

  let transcript = $state('');
  let transcribing = $state(false);
  let generating = $state(false);
  let generatedCount = $state(0);
  let error = $state('');

  async function handleRecordingComplete(blob: Blob) {
    transcribing = true;
    error = '';
    transcript = '';

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Transcription failed: ${res.statusText}`);
      }

      const data = await res.json();
      transcript = data.content;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Transcription failed';
    } finally {
      transcribing = false;
    }
  }

  async function addToPlan() {
    if (!transcript) return;
    generating = true;
    error = '';

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        throw new Error(`Plan generation failed: ${res.statusText}`);
      }

      const data = await res.json();
      generatedCount = data.count;
      transcript = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Plan generation failed';
    } finally {
      generating = false;
    }
  }
</script>

<div class="max-w-xl mx-auto">
  <h1 class="text-2xl font-bold mb-8 text-center">Record</h1>

  <RecordButton onRecordingComplete={handleRecordingComplete} />

  <!-- Status -->
  <div class="mt-8 space-y-4">
    {#if transcribing}
      <div class="flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
        <div class="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        <span>Transcribing...</span>
      </div>
    {/if}

    {#if error}
      <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
        {error}
      </div>
    {/if}

    {#if generatedCount > 0}
      <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm text-center">
        Added {generatedCount} task{generatedCount > 1 ? 's' : ''} to your plan!
        <a href="/" class="underline ml-1">View plan</a>
      </div>
    {/if}

    {#if transcript}
      <div class="bg-[var(--color-surface)] rounded-lg p-4">
        <h2 class="text-sm font-semibold text-[var(--color-text-muted)] mb-2">Transcript</h2>
        <p class="text-[var(--color-text)] leading-relaxed">{transcript}</p>
      </div>

      <button
        onclick={addToPlan}
        disabled={generating}
        class="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
      >
        {#if generating}
          Generating plan items...
        {:else}
          Add to Plan
        {/if}
      </button>
    {/if}
  </div>
</div>
