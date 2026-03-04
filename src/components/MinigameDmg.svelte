<script>
 import { optimize } from "$lib/image";
 import { onMount, onDestroy } from "svelte";
 import * as m from "$lib/paraglide/messages.js";
 import { gameSession } from "$lib/stores/gameSession.js";

 // --- state ---
 let stopped = false;
 let hit = false;

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

 // movement config
 let RADIUS = 90;
 let SPEED  = 0.0018;

 // hitbox config
 let hbTop = 28;
 let hbRight = 37;
 let hbWidth = 8;
 let hbHeight = 24;
 let hbRotate = 10;

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
   cancelAnimationFrame(animFrame);

   if (targetEl && crossEl) {
     const tRect = targetEl.getBoundingClientRect();
     const cRect = crossEl.getBoundingClientRect();
     const cx = cRect.left + cRect.width / 2;
     const cy = cRect.top  + cRect.height / 2;

     hit =
       cx >= tRect.left &&
       cx <= tRect.right &&
       cy >= tRect.top &&
       cy <= tRect.bottom;
   }

   restartTimeout = setTimeout(restart, 3000);
 }

 function restart() {
   stopped = false;
   hit = false;
   crossX = 0;
   crossY = 0;
   startTime = null;
   p = randomParams();
   animFrame = requestAnimationFrame(moveCross);
 }

 onMount(() => {
   animFrame = requestAnimationFrame(moveCross);
 });

 onDestroy(() => {
   cancelAnimationFrame(animFrame);
   clearTimeout(restartTimeout);
 });
</script>

<div class="flex items-end justify-between w-full gap-4">

  <!-- soldier -->
  <img
    class="w-125 object-contain z-10 relative"
    srcset={optimize("/img/mini_dmg_soldier.png")}
    alt=""
  />

  <div class="relative">
    <!-- hitbox -->
    <div
      bind:this={targetEl}
      class="absolute bg-red-500/40 rounded-full pointer-events-none z-10 flex items-center justify-center"
      style="top: {hbTop * 4}px; right: {hbRight * 4}px; width: {hbWidth * 4}px; height: {hbHeight * 4}px; transform: rotate({hbRotate}deg);"
    >
      {#if !stopped}
       <!-- aiming cross -->
       <div
         bind:this={crossEl}
         class="absolute pointer-events-none"
         style="transform: translate({crossX}px, {crossY}px) rotate(-{hbRotate}deg); width: 40px; height: 40px;"
       >
         <div class="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 -translate-y-1/2"></div>
         <div class="absolute left-1/2 top-0 h-full w-0.5 bg-red-500 -translate-x-1/2"></div>
       </div>
      {:else}
      <!-- bullet hole -->
        <img
          class="absolute w-10 h-10 object-contain pointer-events-none z-20"
          style="transform: translate({crossX}px, {crossY}px);"
          srcset={optimize("/img/mini_dmg_shot.png")}
          alt=""
        />
      {/if}
    </div>

    <!-- target image -->
    <img
      class="h-120 object-contain relative"
      srcset={optimize("/img/mini_dmg_target.png")}
      alt=""
    />
  </div>
</div>

<!-- shoot button / result feedback -->
{#if !stopped}
  <button
    class="absolute bottom-10 z-10 bg-primary text-white text-2xl font-bold h-35 w-35 rounded-full cursor-pointer"
    on:click={handleClick}
  >
    {m.shoot()}
  </button>
{:else}
  <div
    class="absolute bottom-10 z-10 bg-primary text-2xl font-bold h-35 w-35 rounded-full flex items-center justify-center text-white"
  >
    {hit ? 'HIT!' : 'MISS!'}
  </div>
{/if}

<!-- debug panel -->
{#if $gameSession?.debug}
<div class="fixed top-2 left-2 z-50 text-xs p-3 flex flex-col gap-1.5 w-52">
  <span class="font-bold text-sm">Movement</span>

  <label class="flex flex-col">
    Radius: {RADIUS}
    <input type="range" min="10" max="200" step="1" bind:value={RADIUS} />
  </label>

  <label class="flex flex-col">
    Speed: {SPEED.toFixed(4)}
    <input type="range" min="0.0005" max="0.005" step="0.0001" bind:value={SPEED} />
  </label>

  <span class="font-bold text-sm mt-2">Hitbox</span>

  <label class="flex flex-col">
    Top: {hbTop}
    <input type="range" min="0" max="70" step="1" bind:value={hbTop} />
  </label>

  <label class="flex flex-col">
    Right: {hbRight}
    <input type="range" min="0" max="70" step="1" bind:value={hbRight} />
  </label>

  <label class="flex flex-col">
    Width: {hbWidth}
    <input type="range" min="2" max="70" step="1" bind:value={hbWidth} />
  </label>

  <label class="flex flex-col">
    Height: {hbHeight}
    <input type="range" min="2" max="70" step="1" bind:value={hbHeight} />
  </label>
</div>
{/if}
