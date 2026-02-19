<script>
 import { onMount } from "svelte";
 import { optimize } from "$lib/image";
 import PlayerBust from "$components/PlayerBust.svelte";

 let { player = null, children, openTrigger = null } = $props();

 let open = $state(false);
 let scrollEl = $state(null);
 let closeTimer = null;

 function showAndAutoClose() {
  if (closeTimer) clearTimeout(closeTimer);
  open = true;
  closeTimer = setTimeout(() => {
   open = false;
  }, 3000);
 }

 onMount(() => {
  showAndAutoClose();
 });

 $effect(() => {
  openTrigger;
  showAndAutoClose();
 });

 function toggle() {
  open = !open;
 }
</script>

<div class="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
 <!-- Scroll body -->
 <button
  bind:this={scrollEl}
  onclick={toggle}
  class="pointer-events-auto w-full max-w-110 transition-transform duration-500 ease-in-out cursor-pointer {open
   ? 'translate-y-0'
   : '-translate-y-[calc(100%-4.5rem)]'}"
 >
  <div class="relative w-full h-130 pt-6 pb-20">
   <img
    srcset={optimize("/img/help_bg.png")}
    alt=""
    class="w-full h-130 object-cover object-bottom absolute inset-0"
   />
   <div class="relative px-13 max-h-110 overflow-y-auto">
    {#if player}
     <div class="float-right ml-2">
      <PlayerBust {player} />
     </div>
    {/if}
    <div class="mt-4 text-left space-y-4">
    {@render children()}
    </div>
   </div>
  </div>

  <!-- Toggle indicator -->
  <div
   class="absolute right-8 bottom-0 z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white"
  >
   <span class="text-xl font-bold">?</span>
  </div>
 </button>
</div>
