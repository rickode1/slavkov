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
  currentMessage = msg.html;
  visible = false;

  // Paint the initial hidden state, then slide in
  requestAnimationFrame(() => { requestAnimationFrame(() => { visible = true; }); });

  hideTimer = setTimeout(() => {
   visible = false;
   removeTimer = setTimeout(() => {
    currentMessage = null;
    notificationMessage.set(null);
   }, 500);
  }, msg.duration);
 });

 onDestroy(clearTimers);
</script>

{#if currentMessage}
 <div
  class="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none
         transition-transform duration-500 ease-in-out
         {visible ? 'translate-y-0' : '-translate-y-full'}"
 >
  <div class="relative w-full max-w-2xl">
   <img
    srcset={optimize("/img/notification_bg.png")}
    alt=""
    class="w-full h-50 object-cover object-bottom"
   />
   <div class="absolute inset-0 w-full flex items-center justify-center px-6 pb-10">
    <p class="text-lg text-center leading-tight">{@html currentMessage}</p>
   </div>
  </div>
 </div>
{/if}
