<script>
 import { onDestroy } from "svelte";

 let { player = null, children, autoOpen = false, duration = 4000 } = $props();

 let visible = $state(false);
 let dismissed = $state(false);
 let hideTimer = null;
 let removeTimer = null;

 function close() {
  clearTimeout(hideTimer);
  visible = false;
  removeTimer = setTimeout(() => { dismissed = true; }, 500);
 }

 $effect(() => {
  if (autoOpen && !dismissed) {
   requestAnimationFrame(() => { requestAnimationFrame(() => { visible = true; }); });
   if (duration) hideTimer = setTimeout(close, duration);
  }
 });

 onDestroy(() => {
  clearTimeout(hideTimer);
  clearTimeout(removeTimer);
 });
</script>

<svelte:head>
  <link rel="preload" href="/img/help_bg.webp" as="image" />
</svelte:head>

{#if !dismissed}
<div
 class="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none
        transition-transform duration-500 ease-in-out
        {visible ? 'translate-y-0' : '-translate-y-full'}"
>
 <div class="pointer-events-auto w-full max-w-110">
  <div class="relative w-full h-135 pb-20">
   <img
    src="/img/help_bg.webp"
    alt=""
    class="w-full h-130 object-cover object-bottom absolute inset-0"
   />
   <div class="relative px-13 max-h-110 overflow-y-auto flex items-center h-full">
    <div class="text-center space-y-4 mx-auto text-lg">
     {@render children()}
    </div>
   </div>
  </div>

  <!-- OK button -->
  <button
   onclick={close}
   class="absolute left-1/2 -translate-x-1/2 bottom-4 z-10 w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer text-xl uppercase"
  >
   ok
  </button>
 </div>
</div>
{/if}
