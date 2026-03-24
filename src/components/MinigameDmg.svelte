<script>
 import { onMount, onDestroy } from "svelte";
 import * as m from "$lib/paraglide/messages.js";
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import Timer from "$components/Timer.svelte";
 import { playSound, preloadSound } from "$lib/audio.js";

 export let onResult = null;
 export let debug = false;

 function setTimer(seconds) {
  fetch('/api/session/timer', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ sessionId: $sessionId, seconds }),
  }).catch(() => {});
 }

 function clearTimer() {
  fetch('/api/session/timer', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ sessionId: $sessionId, seconds: null }),
  }).catch(() => {});
 }

 // --- state ---
 let stopped = false;
 let hit = false;
 let resultFired = false;
 let showResult = false;
 let showHit = false;
 let showCrosshair = false;
 let fired = false;
 let breathingSound = null;

 // countdown
 let countdown = null;
 let countdownInterval = null;

 // crosshair offset relative to the target centre (px)
 let crossX = 0;
 let crossY = 0;

 // animation
 let animFrame;
 let startTime;
 let restartTimeout;

 // DOM refs
 let targetEl;
 let crossEl;
 let fireVideoEl;

 // movement config
 let RADIUS = 120;
 let SPEED  = 0.0025;

 // hitbox config
 const hbTop = 3;
 const hbRight = 18;
 const hbWidth = 26;
 const hbHeight = 53;
 const hbRotate = 12;

 // random params (re-rolled each round)
 let p = randomParams();

 function randomParams() {
   const r = () => Math.random();
   return {
     fx1: 0.8 + r() * 0.6,
     fx2: 2.0 + r() * 1.5,
     fy1: 1.0 + r() * 0.8,
     fy2: 2.5 + r() * 1.5,
     px1: r() * Math.PI * 2,
     px2: r() * Math.PI * 2,
     py1: r() * Math.PI * 2,
     py2: r() * Math.PI * 2,
     ax1: 0.7 + r() * 0.4,
     ax2: 0.2 + r() * 0.3,
     ay1: 0.65 + r() * 0.4,
     ay2: 0.15 + r() * 0.3,
   };
 }

 function moveCross(ts) {
   if (stopped) return;
   if (!startTime) startTime = ts;
   const t = (ts - startTime) * SPEED;

   crossX = Math.sin(t * p.fx1 + p.px1) * RADIUS * p.ax1
           + Math.sin(t * p.fx2 + p.px2) * RADIUS * p.ax2;
   crossY = Math.cos(t * p.fy1 + p.py1) * RADIUS * p.ay1
           + Math.cos(t * p.fy2 + p.py2) * RADIUS * p.ay2;

   animFrame = requestAnimationFrame(moveCross);
 }

 function handleClick() {
   if (stopped) return;   
   stopped = true;
   fired = true;
   if (breathingSound) { breathingSound.stop(); breathingSound = null; }
   if (fireVideoEl) { fireVideoEl.currentTime = 0; fireVideoEl.play(); }
   setTimeout(() => { showCrosshair = false; }, 200);
   playSound('/sounds/musket.mp3');
   setTimeout(() => { showResult = true; }, 1400);
   cancelAnimationFrame(animFrame);

   if (targetEl && crossEl) {
     const tRect = targetEl.getBoundingClientRect();
     const cRect = crossEl.getBoundingClientRect();

     // centres in screen space
     const cx = cRect.left + cRect.width  / 2;
     const cy = cRect.top  + cRect.height / 2;
     const tx = tRect.left + tRect.width  / 2;
     const ty = tRect.top  + tRect.height / 2;

     // rotate offset into the target's un-rotated local space
     const angle  = -hbRotate * Math.PI / 180;
     const dx     = cx - tx;
     const dy     = cy - ty;
     const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
     const localY = dx * Math.sin(angle) + dy * Math.cos(angle);

     // ellipse semi-axes (rounded-full on a rect becomes an ellipse)
     const a = (hbWidth  * 4) / 2;
     const b = (hbHeight * 4) / 2;

     hit = (localX / a) ** 2 + (localY / b) ** 2 <= 1;
   }

   setTimeout(() => {
     showHit = true;
   }, 300);

   setTimeout(() => {
     playSound('/sounds/impact.mp3', { volume: 0.3 })
   }, 500);

   setTimeout(() => {
        if (hit) playSound('/sounds/trumpet.mp3', { volume: 1.7 });
        else playSound('/sounds/wah-wah.mp3');
   }, 1500);

   if (hit && onResult && !debug && !resultFired) {
     clearTimer();
     restartTimeout = setTimeout(() => { resultFired = true; onResult(true); }, 6000);
   } else if (onResult && !debug && !resultFired) {
     clearTimer();
     restartTimeout = setTimeout(() => { resultFired = true; onResult(false); }, 6000);
   } else {
     restartTimeout = setTimeout(restart, 6000);
   }
 }

 function restart() {
   stopped = false;
   hit = false;
   showResult = false;
   showHit = false;
   showCrosshair = true;
   fired = false;
   crossX = 0;
   crossY = 0;
   startTime = null;
   p = randomParams();
   breathingSound = playSound('/sounds/breathing.mp3', { loop: true, volume: 0.4 });
   animFrame = requestAnimationFrame(moveCross);
 }

 function startCountdown() {
   countdown = 5;
   countdownInterval = setInterval(() => {
     countdown--;
     if (countdown <= 0) {
       clearInterval(countdownInterval);
       countdownInterval = null;
       countdown = null;
       showCrosshair = true;
       animFrame = requestAnimationFrame(moveCross);
       breathingSound = playSound('/sounds/breathing.mp3', { loop: true, volume: 0.4 });
       if (onResult && !debug) setTimer(30);
     }
   }, 1000);
 }

 function handleTimerExpiry() {
   if (!resultFired) {
     resultFired = true;
     stopped = true;
     cancelAnimationFrame(animFrame);
     playSound('/sounds/wah-wah.mp3');
     onResult(false);
   }
 }

 onMount(() => {
   preloadSound('/sounds/musket.mp3');
   preloadSound('/sounds/breathing.mp3');
   preloadSound('/sounds/impact.mp3');
   preloadSound('/sounds/trumpet.mp3');
   preloadSound('/sounds/wah-wah.mp3');
   startCountdown();
 });

 onDestroy(() => {
   cancelAnimationFrame(animFrame);
   clearTimeout(restartTimeout);
   clearInterval(countdownInterval);
   if (breathingSound) { breathingSound.stop(); breathingSound = null; }
 });
</script>

<svelte:head>
  <link rel="preload" href="/img/mini_dmg_bg.webp" as="image" />
  <link rel="preload" href="/img/map_frame.webp" as="image" />
  <link rel="preload" href="/img/mini_dmg_soldier.webp" as="image" />
  <link rel="preload" href="/img/mini_dmg_soldier.webp" as="image" type="image/webp" />
  <link rel="preload" href="/img/mini_dmg_crosshair.webp" as="image" />
  <link rel="preload" href="/img/mini_dmg_shot.webp" as="image" />
  <link rel="preload" href="/img/mini_dmg_target_c.webp" as="image" />
  <link rel="preload" href="/img/mini_dmg_soldier_fire.webm" as="video" type="video/webm" />
</svelte:head>

<div class="relative w-full z-10 -mt-[10vh]" style="height: 85vh; overflow: clip;">
  <img
    class="absolute inset-0 w-full h-full object-cover"
    src="/img/mini_dmg_bg.webp"
    alt=""
  />
  <img
    class="absolute inset-0 w-full h-full z-20 pointer-events-none"
    src="/img/map_frame.webp"
    alt=""
  />

<div class="flex items-end justify-between w-full h-full gap-4 relative z-10">

  <!-- soldier -->

    <img
      class="w-124 object-contain absolute bottom-10 left-8"
      class:opacity-0={countdown === null}
      src="/img/mini_dmg_soldier_start.webp" alt=""
    />

    <video
      bind:this={fireVideoEl}
      class="w-340 object-contain absolute -bottom-19 -left-13"
      class:opacity-0={!fired}
      style="mask-image: linear-gradient(to bottom, transparent 0%, black 15%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%);"
      muted playsinline preload="auto"
    >
      <source src="/img/mini_dmg_soldier_fire.webm" type="video/webm" />
    </video>

    <img
      class="w-125 object-contain absolute bottom-10 left-9"
      class:opacity-0={countdown !== null || fired}
      src="/img/mini_dmg_soldier.webp" alt=""
    />


  <div class="absolute bottom-28 right-40">
    <!-- hitbox -->
    <div
      bind:this={targetEl}
      class="absolute rounded-full pointer-events-none z-10 flex items-center justify-center"
      style="top: {hbTop * 4}px; right: {hbRight * 4}px; width: {hbWidth * 4}px; height: {hbHeight * 4}px; transform: rotate({hbRotate}deg);"
    >
      {#if showCrosshair}
       <!-- aiming crosshair -->
       <img
         bind:this={crossEl}
         class="absolute pointer-events-none w-10 h-10 object-contain"
         style="transform: translate({crossX}px, {crossY}px) rotate(-{hbRotate}deg);"
         src="/img/mini_dmg_crosshair.webp"
         alt=""
       />
      {/if}
      {#if showHit}
      <!-- bullet hole -->
        <img
          class="absolute w-10 h-10 object-contain pointer-events-none z-20"
          style="transform: translate({crossX}px, {crossY}px);"
          src="/img/mini_dmg_shot.webp"
          alt=""
        />
      {/if}
    </div>

    <!-- target image -->
    <img
      class="h-90 object-contain relative"
      src="/img/mini_dmg_target_c.webp"
      alt=""
    />
  </div>
</div>
</div>

<!-- shoot button -->
{#if !stopped && countdown === null}
  <button
    class="absolute bottom-10 z-10 bg-primary text-white text-2xl font-bold h-35 w-35 rounded-full cursor-pointer result-pop"
    on:click={handleClick}
  >
    {m.shoot()}
  </button>
{/if}

{#if showResult || countdown !== null}
 <div class="fixed inset-0 flex items-center justify-center z-40 bg-black/60 pointer-events-none">
  <span
    class="text-[10rem] font-bold text-white drop-shadow-2xl -mt-[10vh]"
    class:result-pop={countdown === null}
  >
    {#if countdown !== null}
      {countdown}
    {:else}
      {hit ? m.minigame_win() : m.minigame_fail()}
    {/if}
  </span>
 </div>
{/if}

{#if onResult && countdown === null && !stopped}
 <Timer classes="fixed right-8 top-6" onExpiry={handleTimerExpiry} />
{/if}

<!-- debug panel -->
{#if debug}
<div class="fixed top-0 left-0 z-50 text-xs p-3 flex flex-col gap-1.5 w-52 bg-white">
  <span class="font-bold text-sm">Difficulty</span>

  <label class="flex flex-col">
    Radius: {RADIUS}
    <input type="range" min="10" max="200" step="1" bind:value={RADIUS} />
  </label>

  <label class="flex flex-col">
    Speed: {SPEED.toFixed(4)}
    <input type="range" min="0.0005" max="0.005" step="0.0001" bind:value={SPEED} />
  </label>


</div>
{/if}
