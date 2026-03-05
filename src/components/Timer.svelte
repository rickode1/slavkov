<script>
 import { onDestroy } from 'svelte';
 import { get } from 'svelte/store';
 import { timerActive, timerRemaining } from '$lib/stores/timer.js';
 import { sessionId, gameSession } from '$lib/stores/gameSession.js';

 let { classes = 'fixed right-4 bottom-4', onExpiry = null } = $props();

 $effect(() => {
  const active = $timerActive;
  if (active) {
   const interval = setInterval(() => {
    if (get(gameSession)?.debug) return;
    timerRemaining.update((r) => {
     if (r <= 1) {
      clearInterval(interval);
      timerActive.set(false);
      handleExpiry();
      return 0;
     }
     return r - 1;
    });
   }, 1000);
   return () => clearInterval(interval);
  }
 });

 async function handleExpiry() {
  if (onExpiry) {
   onExpiry();
   return;
  }

  const id = $sessionId;
  if (!id) return;
  try {
   await fetch('/api/session/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: id, status: '0-abandoned' }),
   });
  } catch (e) {
   console.error('Failed to abandon session on timer expiry', e);
  }
 }
</script>

{#if $timerActive}
<div class="{classes} w-14 lg:w-20 h-16 lg:h-22 inline-flex items-center justify-center">
 <svg
  class="absolute inset-0 w-full h-full"
  viewBox="0 0 49 59"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
 >
  <path
   d="M24.4996 56.2297C36.9215 56.2297 46.9914 46.1598 46.9914 33.7379C46.9914 21.316 36.9215 11.2461 24.4996 11.2461C12.0777 11.2461 2.00781 21.316 2.00781 33.7379C2.00781 46.1598 12.0777 56.2297 24.4996 56.2297Z"
   stroke="black"
   stroke-width="4.01639"
   stroke-miterlimit="10"
  />
  <path
   d="M32.7855 6.42623C31.8336 2.73115 28.488 0 24.4997 0C20.5114 0 17.1658 2.73115 16.2139 6.42623H32.7895H32.7855Z"
   fill="black"
  />
 </svg>
 <span class="mt-2">
  {$timerRemaining}s
 </span>
</div>
{/if}