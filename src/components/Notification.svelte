<script>
 import { onDestroy } from "svelte";
 import { optimize } from "$lib/image";
 import { notificationMessage } from "$lib/stores/notification.js";

 let visible = $state(false);
 let currentMessage = $state(null);
 let hideTimer = null;
 let removeTimer = null;

 function clearTimers() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  if (removeTimer) { clearTimeout(removeTimer); removeTimer = null; }
 }

 $effect(() => {
  const msg = $notificationMessage;
  if (!msg) return;

  clearTimers();
  currentMessage = msg;
  visible = false;

  // Paint the initial hidden state, then slide in
  requestAnimationFrame(() => { requestAnimationFrame(() => { visible = true; }); });

  hideTimer = setTimeout(() => {
   visible = false;
   removeTimer = setTimeout(() => {
    currentMessage = null;
    notificationMessage.set(null);
   }, 500);
  }, 4000);
 });

 onDestroy(clearTimers);
</script>

{#if currentMessage}
 <div
  class="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none
         transition-transform duration-500 ease-in-out
         {visible ? 'translate-y-0' : '-translate-y-full'}"
 >
  <div class="relative w-full max-w-3xl">
   <img
    srcset={optimize("/img/notification_bg.png")}
    alt=""
    class="w-full h-auto object-cover object-bottom"
   />
   <div class="absolute inset-0 w-full pt-20 pb-14 py-6">
    <p class="text-2xl text-center">{@html currentMessage}</p>
   </div>
  </div>
 </div>
{/if}
