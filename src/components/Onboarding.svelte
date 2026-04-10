<script>
 import { onMount } from "svelte";
 import ArrowButton from "./ArrowButton.svelte";
 import { m } from "$lib/paraglide/messages.js";

 let { autoslide = true, oncomplete = null, onclose = null } = $props();

 // Static slide definitions — text via reactive derived, image & duration static
 const SLIDES = [
  { image: "/img/map.webp", duration: 14000 },
  { image: "/img/bonus_unit.webp", duration: 20000 },
  { image: "/img/onboarding_loc.webp", duration: 9000 },
  { image: "/img/onboarding_bonuses.webp", duration: 9000 },
  { image: "/img/onboarding_minigames.webp", duration: 9000 },
  { image: "/img/onboarding_battle.webp", duration: 15000 },
 ];

 let slideTexts = $derived([
  m.onboarding_1(),
  m.onboarding_2(),
  m.onboarding_3(),
  m.onboarding_4(),
  m.onboarding_5(),
  m.onboarding_6(),
 ]);

 let currentIndex = $state(0);
 let progress = $state(0);
 let animFrameId = null;

 function startTimer() {
  const duration = SLIDES[currentIndex].duration;
  const startTime = performance.now();

  function tick(now) {
   progress = Math.min((now - startTime) / duration, 1);
   if (progress >= 1) {
    next();
   } else {
    animFrameId = requestAnimationFrame(tick);
   }
  }
  animFrameId = requestAnimationFrame(tick);
 }

 function goTo(index) {
  cancelAnimationFrame(animFrameId);
  currentIndex = index;
  progress = 0;
  if (autoslide) startTimer();
 }

 function next() {
  if (currentIndex < SLIDES.length - 1) {
   goTo(currentIndex + 1);
  } else {
   completeOnboarding();
  }
 }

 function prev() {
  if (currentIndex > 0) goTo(currentIndex - 1);
 }

 async function completeOnboarding() {
  oncomplete?.();
 }

 onMount(() => {
  SLIDES.forEach(slide => {
   const img = new Image();
   img.src = slide.image;
  });
  if (autoslide) startTimer();
  return () => cancelAnimationFrame(animFrameId);
 });

 // SVG ring constants
 const RADIUS = 36;
 const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
 let dashOffset = $derived(CIRCUMFERENCE * (1 - progress));
</script>

<div class="flex flex-col items-center w-full pt-16 lg:pt-24 pb-4 gap-4 lg:gap-6 relative" style="height: 100vh;">

 {#if onclose}
  <button
   onclick={onclose}
   class="absolute top-6 right-8 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-2xl lg:text-4xl leading-none cursor-pointer z-10"
   aria-label="Close"
  >✕</button>
 {/if}

 <!-- Text first, limited width, top padding -->
 <div class="text-center text-black text-lg lg:text-2xl leading-snug max-w-4xl px-4">
  {@html slideTexts[currentIndex]}
 </div>

 <!-- Image second, fixed height -->
 <div class="flex items-center justify-center w-full py-4 lg:py-10">
  <img
   src={SLIDES[currentIndex].image}
   alt=""
   class="h-48 lg:h-56 w-auto max-w-full object-contain"
  />
 </div>

 <!-- Hourglass + dots together -->
 <div class="flex flex-col items-center gap-3 mt-auto">

  {#if autoslide}
   <!-- Hourglass with circular progress ring -->
   <div class="relative flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 cursor-pointer" onclick={next}>
    <svg
     class="absolute inset-0 w-full h-full -rotate-90"
     viewBox="0 0 80 80"
     fill="none"
     xmlns="http://www.w3.org/2000/svg"
    >
     <circle cx="40" cy="40" r={RADIUS} stroke="#0D3870" stroke-opacity="0.3" stroke-width="4" />
     <circle
      cx="40"
      cy="40"
      r={RADIUS}
      stroke="#0D3870"
      stroke-width="4"
      stroke-linecap="round"
      stroke-dasharray={CIRCUMFERENCE}
      stroke-dashoffset={dashOffset}
     />
    </svg>
    <div class="bg-secondary rounded-full w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center">
     <svg class="w-8 h-8 lg:w-9 lg:h-9 text-white hourglass-flip" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12L7.72711 8.43926C7.09226 7.91022 6.77484 7.6457 6.54664 7.32144C6.34444 7.03413 6.19429 6.71354 6.10301 6.37428C6 5.99139 6 5.57819 6 4.7518V2M12 12L16.2729 8.43926C16.9077 7.91022 17.2252 7.6457 17.4534 7.32144C17.6556 7.03413 17.8057 6.71354 17.897 6.37428C18 5.99139 18 5.57819 18 4.7518V2M12 12L7.72711 15.5607C7.09226 16.0898 6.77484 16.3543 6.54664 16.6786C6.34444 16.9659 6.19429 17.2865 6.10301 17.6257C6 18.0086 6 18.4218 6 19.2482V22M12 12L16.2729 15.5607C16.9077 16.0898 17.2252 16.3543 17.4534 16.6786C17.6556 16.9659 17.8057 17.2865 17.897 17.6257C18 18.0086 18 18.4218 18 19.2482V22M4 2H20M4 22H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
     </svg>
    </div>
   </div>
  {:else}
   <div class="flex items-center gap-6 lg:gap-10">
    <ArrowButton direction="left" onclick={prev} classes="w-14 h-14 {currentIndex === 0 ? 'opacity-30 pointer-events-none' : ''}" />
    <ArrowButton direction="right" onclick={next} classes="w-14 h-14" />
   </div>
  {/if}

  <!-- Dot indicators -->
  <div class="flex items-center gap-2 min-h-4">
   {#each SLIDES as _, i}
    <button
     class="rounded-full transition-all duration-300 bg-secondary {i === currentIndex ? 'w-4 h-4' : 'w-2.5 h-2.5 opacity-30'}"
     onclick={() => goTo(i)}
     aria-label="Go to slide {i + 1}"
    ></button>
   {/each}
  </div>

 </div>

</div>
