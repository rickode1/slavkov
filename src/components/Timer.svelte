<script>
 import { onMount } from 'svelte';
 import { gameSession } from '$lib/stores/gameSession.js';
 import { timerActive, timerRemaining } from '$lib/stores/timer.js';
 import { playSound, preloadSound } from '$lib/audio.js';

 let { classes = 'fixed right-4 bottom-4', onExpiry = null, sound = true } = $props();

 let tikTak = null;

 let deadline = $derived($gameSession?.timer_deadline ?? null);

 function calcRemaining(dl) {
  if (!dl) return 0;
  return Math.max(0, Math.ceil((new Date(dl).getTime() - Date.now()) / 1000));
 }

 $effect(() => {
  const dl = deadline;

  // Clean up previous sounds
  tikTak?.stop();
  tikTak = null;

  if (!dl) {
   timerActive.set(false);
   timerRemaining.set(0);
   return;
  }

  const initial = calcRemaining(dl);
  if (initial <= 0) {
   timerActive.set(false);
   timerRemaining.set(0);
   return;
  }

  timerRemaining.set(initial);
  timerActive.set(true);

  if (sound && initial <= 20) {
   tikTak = playSound('/sounds/tik-tak.mp3', { loop: true });
  }

  const interval = setInterval(() => {
   if ($gameSession?.debug) return;
   const r = calcRemaining(dl);
   timerRemaining.set(r);

   if (r <= 0) {
    clearInterval(interval);
    timerActive.set(false);
    tikTak?.stop();
    tikTak = null;
    if (onExpiry) onExpiry();
    return;
   }

   if (sound && r === 20 && !tikTak) {
    tikTak = playSound('/sounds/tik-tak.mp3', { loop: true });
   }
  }, 1000);

  return () => {
   clearInterval(interval);
   tikTak?.stop();
   tikTak = null;
  };
 });

 onMount(() => {
  preloadSound('/sounds/tik-tak.mp3');
 });
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
 <span class="mt-2 font-bold">
  {$timerRemaining}s
 </span>
</div>
{/if}