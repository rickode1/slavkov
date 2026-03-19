<script>
 import { optimize } from "$lib/image";

 let { player = null, children, autoOpen = false } = $props();

 let open = $state(false);
 let scrollEl = $state(null);
 let closeTimer = null;

 function toggle() {
  open = !open;
 }

 $effect(() => {
  if (autoOpen) open = true;
 });
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
  <div class="relative w-full h-135 pb-20">
   <img
    srcset={optimize("/img/help_bg.png")}
    alt=""
    class="w-full h-130 object-cover object-bottom absolute inset-0"
   />
   <div class="relative px-13 max-h-110 overflow-y-auto flex items-center h-full">
    <div class="text-center space-y-4">
    {@render children()}
    </div>
   </div>
  </div>

  <!-- Toggle indicator -->
  <div
   class="absolute left-1/2 -translate-x-1/2 bottom-4 z-10 w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white"
  >
   <span class="text-xl uppercase">{ open ? 'ok' : '?'}</span>
  </div>
 </button>
</div>
