<script>
 import { onMount, onDestroy } from "svelte";
 import * as m from "$lib/paraglide/messages.js";
 import { gameSession } from "$lib/stores/gameSession.js";
 import { playSound, preloadSound } from "$lib/audio.js";

 export let onResult = null;
 export let debug = false;

 // countdown
 let countdown = null;
 let countdownInterval = null;

 let groundSpeed = 9;
 let obstacleInterval = 200;
 let jumpHeight = 380;
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
 let fallVideoEl;
 let slowdownStart = 0;
 let speedAtFinish = 0;
 let showWinPose = false;
 let runSound = null;

 const FALL_SRC = "/img/mini_def_soldier_fall.webm";

 function triggerFall() {
   if (runSound) { runSound.stop(); runSound = null; }
   gameState = 'lost';
   playSound('/sounds/hit.mp3');
   playSound('/sounds/fall.mp3');
   setTimeout(() => playSound('/sounds/wah-wah.mp3'), 500);
   if (fallVideoEl) {
     fallVideoEl.currentTime = 0;
     fallVideoEl.play();
   }
 }

 const OBSTACLE_IMGS = [
   { src: "/img/mini_def_obstacle.webp",  height: 80  },
   { src: "/img/mini_def_obstacle2.webp", height: 80  },
   { src: "/img/mini_def_obstacle3.webp", height: 140 },
   { src: "/img/mini_def_obstacle4.webp", height: 140 },   
 ];


 const SOLDIER_IMG_WIDTH = 400;
 const SOLDIER_LEFT = 60;
 const SOLDIER_HB_WIDTH = 70;
 const SOLDIER_HB_LEFT = SOLDIER_LEFT + SOLDIER_IMG_WIDTH - SOLDIER_HB_WIDTH;

 function startGame() {
   if (runSound) { runSound.stop(); runSound = null; }
   gameState = 'running';
   groundOffset = 0;
   soldierY = 0;
   isJumping = false;
   showWinPose = false;
   obstacles = [];
   frameCount = 0;
   nextObstacleAt = 60;
   finishReached = false;
   finishX = groundSpeed * TARGET_FPS * GAME_DURATION_S;

   if (gameAreaEl) {
     gameWidth = gameAreaEl.clientWidth;
   }

   animFrame = requestAnimationFrame(gameLoop);
   runSound = playSound('/sounds/run.mp3', { loop: true, rate: 0.7 });
 }

 function gameLoop(ts) {
   if (gameState !== 'running' && gameState !== 'slowing') return;

   // --- compute effective speed (decelerate to 0 over 1s after finish) ---
   let currentSpeed = groundSpeed;
   if (gameState === 'slowing') {
     const elapsed = performance.now() - slowdownStart;
     if (elapsed >= 1000) {
       gameState = 'won';
       if (runSound) { runSound.stop(); runSound = null; }
       playSound('/sounds/trumpet.mp3');
       cancelAnimationFrame(animFrame);
       if (onResult && !debug) { setTimeout(() => onResult(true), 6000); } else { setTimeout(resetGame, 6000); }
       return;
     }
     currentSpeed = speedAtFinish * (1 - elapsed / 1500);
   }

   // move ground
   groundOffset = (groundOffset + currentSpeed) % gameWidth;

   // move obstacles
   for (let i = 0; i < obstacles.length; i++) {
     obstacles[i].x -= currentSpeed;
   }
   // remove off-screen obstacles
   // obstacles = obstacles.filter(o => o.x > -OBS_WIDTH);

   if (gameState === 'running') {
     // spawn obstacles (semi-random intervals) — stop when finish is approaching
     frameCount++;
     if (frameCount >= nextObstacleAt && !finishReached && finishX > gameWidth + 200) {
       const def = OBSTACLE_IMGS[Math.floor(Math.random() * OBSTACLE_IMGS.length)];
       const aspectRatio = (def.naturalWidth && def.naturalHeight) ? def.naturalWidth / def.naturalHeight : 1.625;
       obstacles = [...obstacles, { x: gameWidth + 20, img: def.src, height: def.height, width: Math.round(def.height * aspectRatio) }];
       const variance = obstacleInterval * 0.5;
       const gap = Math.max(60, obstacleInterval + Math.floor(Math.random() * variance * 2 - variance));
       nextObstacleAt = frameCount + gap;
     }

     // move finish line
     finishX -= groundSpeed;
     if (finishX <= SOLDIER_HB_LEFT + SOLDIER_HB_WIDTH && !finishReached) {
       finishReached = true;
       setTimeout(()=>{showWinPose = true}, 1300);
     }
     if (finishReached && finishX <= SOLDIER_HB_LEFT && !isJumping) {
       gameState = 'slowing';
       slowdownStart = performance.now();
       speedAtFinish = groundSpeed;
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
         if (gameState === 'running' && !runSound) { runSound = playSound('/sounds/run.mp3', { loop: true, rate: 0.6 }); }
       }
     }

     // collision detection
     for (const obs of obstacles) {
       const obsLeft = obs.x;
       const obsRight = obs.x + obs.width;
       const soldierLeft = SOLDIER_HB_LEFT;
       const soldierRight = SOLDIER_HB_LEFT + SOLDIER_HB_WIDTH;
       const soldierBottom = soldierY;

       // approach from the side (30px grace margin at entry)
       const sideOverlap = soldierRight > obsLeft + 30 && soldierLeft < obsRight;
       // landing on top: descending phase of jump, no grace margin
       const isDescending = isJumping && (performance.now() - jumpStart) > jumpDuration / 2;
       const topLanding = isDescending && soldierRight > obsLeft && soldierLeft < obsRight;

       if ((sideOverlap || topLanding) && soldierBottom > -obs.height) {
           triggerFall();
           cancelAnimationFrame(animFrame);
           if (onResult && !debug) { setTimeout(() => onResult(false), 6000); } else { setTimeout(resetGame, 6000); }
           return;
       }
     }
   } else {
     // slowing — keep finish line scrolling with the ground
     finishX -= currentSpeed;
   }

   animFrame = requestAnimationFrame(gameLoop);
 }

 function handleJump() {
   if (gameState !== 'running' || isJumping) return;
   isJumping = true;
   jumpStart = performance.now();
   if (runSound) { runSound.stop(); runSound = null; }
   playSound('/sounds/jump.mp3');
 }

 function resetGame() {
   startGame();
 }

 function startCountdown() {
   if (gameAreaEl) gameWidth = gameAreaEl.clientWidth;
   countdown = 5;
   countdownInterval = setInterval(() => {
     countdown--;
     if (countdown <= 0) {
       clearInterval(countdownInterval);
       countdownInterval = null;
       countdown = null;
       startGame();
     }
   }, 1000);
 }

 onMount(async () => {
   if (gameAreaEl) gameWidth = gameAreaEl.clientWidth;

   // detect natural dimensions from each obstacle image for accurate hitboxes
   await Promise.all(OBSTACLE_IMGS.map(def => new Promise(resolve => {
     const img = new Image();
     img.onload = () => { def.naturalWidth = img.naturalWidth; def.naturalHeight = img.naturalHeight; resolve(); };
     img.onerror = () => resolve();
     img.src = def.src;
   })));

   // prebuffer all game sounds
   preloadSound('/sounds/run.mp3');
   preloadSound('/sounds/jump.mp3');
   preloadSound('/sounds/hit.mp3');
   preloadSound('/sounds/fall.mp3');
   preloadSound('/sounds/trumpet.mp3');
   preloadSound('/sounds/wah-wah.mp3');
   // video is preloaded via preload="auto" attribute
   startCountdown();
 });

 onDestroy(() => {
   cancelAnimationFrame(animFrame);
   clearInterval(countdownInterval);
   if (runSound) { runSound.stop(); runSound = null; }
 });

 function portal(node) {
   document.body.appendChild(node);
   return { destroy() { node.remove(); } };
 }
</script>

<svelte:head>
  <link rel="preload" href="/img/map_frame.webp" as="image" />
  <link rel="preload" href="/img/mini_def_ground.webp" as="image" />
  <link rel="preload" href="/img/mini_def_soldier_start.webp" as="image" />
  <link rel="preload" href="/img/mini_def_soldier_jump.webp" as="image" />
  <link rel="preload" href="/img/mini_def_soldier_run.webp" as="image" type="image/webp" />
  <link rel="preload" href="/img/mini_def_soldier_win.webp" as="image" type="image/webp" />
  <link rel="preload" href="/img/mini_def_obstacle.webp" as="image" />
  <link rel="preload" href="/img/mini_def_obstacle2.webp" as="image" />
  <link rel="preload" href="/img/mini_def_obstacle3.webp" as="image" />
  <link rel="preload" href="/img/mini_def_obstacle4.webp" as="image" />
  <link rel="preload" href="/img/mini_def_finish.webp" as="image" />
  <link rel="preload" href="/img/mini_def_soldier_fall.webm" as="video" type="video/webm" />
</svelte:head>

<div
  bind:this={gameAreaEl}
  class="relative w-full z-10 -mt-[108px]"
  style="height: 918px; overflow: clip;"
>
  <img
   class="absolute inset-0 w-full h-full z-10 pointer-events-none"
   src="/img/map_frame.webp"
   alt=""
  />
  <img
    class="absolute bottom-0 h-20 w-full object-cover"
    style="transform: translateX(-{groundOffset}px); width: 200%;"
    src="/img/mini_def_ground.webp"
    alt=""
  />
  <img
    class="absolute bottom-0 h-20 w-full object-cover"
    style="transform: translateX({gameWidth - groundOffset}px); width: 200%;"
    src="/img/mini_def_ground.webp"
    alt=""
  />

  <img
    class="absolute bottom-11 z-10 w-100 object-contain"
    style="left: {SOLDIER_LEFT}px; transform: translateY({soldierY}px); display: {gameState === 'lost' || showWinPose ? 'none' : 'block'};"
    src={gameState === 'ready' ? "/img/mini_def_soldier_start.webp" : isJumping ? "/img/mini_def_soldier_jump.webp" : "/img/mini_def_soldier_run.webp"}
    alt=""
  />
  <img
    class="absolute bottom-11 z-10 w-130 object-contain"
    style="left: {SOLDIER_LEFT+270}px; display: {showWinPose ? 'block' : 'none'};"
    src="/img/mini_def_soldier_win.webp"
    alt=""
  />
  <video
    bind:this={fallVideoEl}
    class="absolute bottom-8 z-10 w-180 object-contain"
    style="left: {SOLDIER_LEFT+270}px; display: {gameState !== 'lost' ? 'none' : 'block'};"
    muted
    playsinline
    preload="auto"
  >
    <source src={FALL_SRC} type="video/webm" />
  </video>

  <!-- obstacles -->
  {#each obstacles as obs}
    <img
      class="absolute bottom-11 object-contain"
      style="left: {obs.x}px; height: {obs.height}px;"
      src={obs.img}
      alt=""
    />
  {/each}

  <!-- finish line -->
  {#if finishX < gameWidth + 100}
    <img
      class="absolute -bottom-4 h-90 object-contain"
      style="left: {finishX}px;"
      src="/img/mini_def_finish.webp"
      alt="Finish"
    />
  {/if}
</div>

<!-- button / result -->
{#if gameState === 'running'}
  <button
    class="absolute bottom-4 z-10 bg-primary text-white text-2xl font-bold h-35 w-35 rounded-full cursor-pointer btn-pulse"
    on:click={handleJump}
  >
    {m.jump()}
  </button>
{/if}

{#if gameState === 'won' || gameState === 'lost' || countdown !== null}
 <div use:portal class="fixed inset-0 flex items-center justify-center z-40 bg-black/60 pointer-events-none">
  <span
    class="text-[10rem] font-bold text-white drop-shadow-2xl -mt-[108px]"
    class:result-pop={countdown === null}
  >
    {#if countdown !== null}
      {countdown}
    {:else}
      {gameState === 'won' ? m.minigame_win() : m.minigame_fail()}
    {/if}
  </span>
 </div>
{/if}

<!-- debug panel -->
{#if debug}
<div class="fixed top-0 left-0 z-50 text-xs p-3 flex flex-col gap-1.5 w-52 bg-white">
  <span class="font-bold text-sm">Difficulty</span>

  <label class="flex flex-col">
    Ground Speed: {groundSpeed}
    <input type="range" min="1" max="15" step="0.5" bind:value={groundSpeed} />
  </label>

  <label class="flex flex-col">
    Obstacle Interval: {obstacleInterval}
    <input type="range" min="30" max="200" step="5" bind:value={obstacleInterval} />
  </label>
</div>
{/if}
