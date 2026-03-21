<script lang="ts">
  let { onRecordingComplete }: {
    onRecordingComplete: (blob: Blob) => void;
  } = $props();

  let recording = $state(false);
  let mediaRecorder: MediaRecorder | null = $state(null);
  let chunks: Blob[] = [];
  let elapsed = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;
  let audioLevel = $state(0);
  let analyser: AnalyserNode | null = null;
  let animFrame: number | null = null;

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateLevel() {
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) {
      const norm = (v - 128) / 128;
      sum += norm * norm;
    }
    audioLevel = Math.sqrt(sum / data.length);
    animFrame = requestAnimationFrame(updateLevel);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio level analysis
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      updateLevel();

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach(t => t.stop());
        ctx.close();
        if (animFrame) cancelAnimationFrame(animFrame);
        analyser = null;
        audioLevel = 0;
      };

      recorder.start(250); // collect chunks every 250ms
      mediaRecorder = recorder;
      recording = true;
      elapsed = 0;
      timer = setInterval(() => elapsed++, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    mediaRecorder = null;
    recording = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function toggle() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
</script>

<div class="flex flex-col items-center gap-6">
  <!-- Audio level ring -->
  <div class="relative">
    <div
      class="absolute inset-0 rounded-full transition-transform duration-75"
      style="transform: scale({1 + audioLevel * 0.5}); background: radial-gradient(circle, rgba(239,68,68,{audioLevel * 0.3}) 0%, transparent 70%)"
    ></div>
    <button
      onclick={toggle}
      class="relative w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all
        {recording
          ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
          : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border-2 border-[var(--color-border)]'}"
      aria-label={recording ? 'Stop recording' : 'Start recording'}
    >
      {#if recording}
        <span class="w-6 h-6 bg-white rounded-sm"></span>
      {:else}
        <span>🎙️</span>
      {/if}
    </button>
  </div>

  <!-- Timer -->
  {#if recording}
    <span class="text-2xl font-mono text-red-400">{formatTime(elapsed)}</span>
  {:else}
    <span class="text-sm text-[var(--color-text-muted)]">Tap to record</span>
  {/if}
</div>
