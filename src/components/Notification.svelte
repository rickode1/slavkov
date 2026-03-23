<script>
 import { onDestroy } from "svelte";
 import { notificationMessage } from "$lib/stores/notification.js";
 import LookPhone from "$components/LookPhone.svelte";

 let visible = $state(false);
 let currentMessage = $state(null);
 let showLookPhone = $state(false);
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
  showLookPhone = msg.showLookPhone ?? false;
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

<svelte:head>
  <link rel="preload" href="/img/notification_bg.webp" as="image" />
</svelte:head>

{#if currentMessage}
 <div
  class="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none
         transition-transform duration-500 ease-in-out
         {visible ? 'translate-y-0' : '-translate-y-full'}"
 >
  <div class="relative w-full max-w-4xl">
   <img
    src="/img/notification_bg.webp"
    alt=""
    class="w-full h-130 object-cover object-bottom"
   />
   <div class="absolute inset-0 w-full flex flex-col items-center justify-center px-24 pb-38 pt-6">
    <p class="text-xl text-center">{@html currentMessage}</p>
    {#if showLookPhone}
     <LookPhone />
    {/if}
   </div>
  </div>
 </div>
{/if}
