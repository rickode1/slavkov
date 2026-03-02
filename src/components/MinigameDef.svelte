<script>
 import { optimize } from "$lib/image";
 import { onMount, onDestroy } from "svelte";
 import * as m from "$lib/paraglide/messages.js";

 let groundSpeed = 6;
 let obstacleInterval = 200;
 let jumpHeight = 150;
 let jumpDuration = 1500;

 const GAME_DURATION_S = 30;
 const TARGET_FPS = 60;

 let gameState = 'ready';    // ready | running | won | lost
 let groundOffset = 0;
 let soldierY = 0;
 let isJumping = false;
 let jumpStart = 0;

 // obstacles: array of { x: number }
 let obstacles = [];
 let frameCount = 0;
 let nextObstacleAt = 60;

 // finish line
 let finishX = 99999;        // off-screen until game starts
 let finishReached = false;

 let animFrame;
 let gameAreaEl;
 let gameWidth = 480;

 // obstacle size
 const OBS_WIDTH = 130;
 const OBS_HEIGHT = 80;

 const SOLDIER_IMG_WIDTH = 400;
 const SOLDIER_LEFT = 60;
 const SOLDIER_HB_WIDTH = 70;
 const SOLDIER_HB_LEFT = SOLDIER_LEFT + SOLDIER_IMG_WIDTH - SOLDIER_HB_WIDTH;

 function startGame() {
   gameState = 'running';
   groundOffset = 0;
   soldierY = 0;
   isJumping = false;
   obstacles = [];
   frameCount = 0;
   nextObstacleAt = 60;
   finishReached = false;
   finishX = groundSpeed * TARGET_FPS * GAME_DURATION_S;

   if (gameAreaEl) {
     gameWidth = gameAreaEl.clientWidth;
   }

   animFrame = requestAnimationFrame(gameLoop);
 }

 function gameLoop(ts) {
   if (gameState !== 'running') return;

   // move ground
   groundOffset = (groundOffset + groundSpeed) % gameWidth;

   // move obstacles
   for (let i = 0; i < obstacles.length; i++) {
     obstacles[i].x -= groundSpeed;
   }
   // remove off-screen obstacles
   obstacles = obstacles.filter(o => o.x > -OBS_WIDTH);

   // spawn obstacles (semi-random intervals) — stop when finish is approaching
   frameCount++;
   if (frameCount >= nextObstacleAt && !finishReached && finishX > gameWidth + 200) {
     obstacles = [...obstacles, { x: gameWidth + 20 }];
     const variance = obstacleInterval * 0.5;
     const gap = Math.max(40, obstacleInterval + Math.floor(Math.random() * variance * 2 - variance));
     nextObstacleAt = frameCount + gap;
   }

   // move finish line
   finishX -= groundSpeed;
   if (finishX <= SOLDIER_HB_LEFT + SOLDIER_HB_WIDTH && !finishReached) {
     finishReached = true;
   }
   if (finishReached && finishX <= SOLDIER_HB_LEFT) {
     gameState = 'won';
     cancelAnimationFrame(animFrame);
     setTimeout(resetGame, 3000);
     return;
   }

   if (isJumping) {
     const elapsed = performance.now() - jumpStart;
     if (elapsed < jumpDuration) {
       const p = elapsed / jumpDuration;
       const t = Math.pow(Math.sin(p * Math.PI), 0.6);
       soldierY = -jumpHeight * t;
     } else {
       soldierY = 0;
       isJumping = false;
     }
   }

   // collision detection
   for (const obs of obstacles) {
     const obsLeft = obs.x;
     const obsRight = obs.x + OBS_WIDTH;
     const soldierLeft = SOLDIER_HB_LEFT;
     const soldierRight = SOLDIER_HB_LEFT + SOLDIER_HB_WIDTH;
     const soldierBottom = soldierY;

     // horizontal overlap
     if (soldierRight > obsLeft && soldierLeft < obsRight) {
       if (soldierBottom > -OBS_HEIGHT) {
         gameState = 'lost';
         cancelAnimationFrame(animFrame);
         setTimeout(resetGame, 3000);
         return;
       }
     }
   }

   animFrame = requestAnimationFrame(gameLoop);
 }

 function handleJump() {
   if (gameState !== 'running' || isJumping) return;
   isJumping = true;
   jumpStart = performance.now();
 }

 function resetGame() {
   startGame();
 }

 onMount(() => {
   if (gameAreaEl) {
     gameWidth = gameAreaEl.clientWidth;
   }
   startGame();
 });

 onDestroy(() => {
   cancelAnimationFrame(animFrame);
 });
</script>

<div
  bind:this={gameAreaEl}
  class="relative w-full z-10"
  style="height: 70vh; overflow: clip;"
>
  <img
    class="absolute bottom-0 h-20 w-full object-cover"
    style="transform: translateX(-{groundOffset}px); width: 200%;"
    srcset={optimize("/img/mini_def_ground.png")}
    alt=""
  />
  <img
    class="absolute bottom-0 h-20 w-full object-cover"
    style="transform: translateX({gameWidth - groundOffset}px); width: 200%;"
    srcset={optimize("/img/mini_def_ground.png")}
    alt=""
  />

  <img
    class="absolute bottom-11 z-10 w-100 object-contain"
    style="left: {SOLDIER_LEFT}px; transform: translateY({soldierY}px);"
    srcset={optimize("/img/mini_def_soldier.png")}
    alt=""
  />

  <!-- obstacles -->
  {#each obstacles as obs}
    <img
      class="absolute bottom-11 h-20 object-contain"
      style="left: {obs.x}px;"
      srcset={optimize("/img/mini_def_obstacle.png")}
      alt=""
    />
  {/each}

  <!-- finish line -->
  {#if finishX < gameWidth + 100}
    <img
      class="absolute -bottom-4 h-90 object-contain"
      style="left: {finishX}px;"
      srcset={optimize("/img/mini_def_finish.png")}
      alt="Finish"
    />
  {/if}
</div>

<!-- button / result -->
{#if gameState === 'running'}
  <button
    class="absolute bottom-10 z-10 bg-primary text-white text-2xl font-bold h-35 w-35 rounded-full cursor-pointer"
    on:click={handleJump}
  >
    {m.jump()}
  </button>
{:else if gameState === 'won'}
  <div
    class="absolute bottom-10 z-10 bg-primary text-2xl font-bold h-35 w-35 rounded-full flex items-center justify-center text-white"
  >
    WIN!
  </div>
{:else}
  <div
    class="absolute bottom-10 z-10 bg-primary text-2xl font-bold h-35 w-35 rounded-full flex items-center justify-center text-white"
  >
    FAIL!
  </div>
{/if}

<!-- debug panel -->
<div class="fixed top-2 left-2 z-50 text-xs p-3 flex flex-col gap-1.5 w-52">
  <span class="font-bold text-sm">Difficulty</span>

  <label class="flex flex-col">
    Ground Speed: {groundSpeed}
    <input type="range" min="1" max="15" step="0.5" bind:value={groundSpeed} />
  </label>

  <label class="flex flex-col">
    Obstacle Interval: {obstacleInterval}
    <input type="range" min="100" max="600" step="10" bind:value={obstacleInterval} />
  </label>
</div>
