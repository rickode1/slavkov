<script>
 import { onDestroy } from "svelte";
 import { notificationMessage } from "$lib/stores/notification.js";
 import { sessionId } from "$lib/stores/gameSession.js";
 import LookPhone from "$components/LookPhone.svelte";

 let visible = $state(false);
 let currentMessage = $state(null);
 let showLookPhone = $state(false);
 let currentOnClose = null;
 let hideTimer = null;
 let removeTimer = null;

 function setHelpOpen(open) {
  const id = $sessionId;
  if (!id) return;
  fetch('/api/session/notification', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ sessionId: id, open }),
  }).catch(() => {});
 }

 function clearTimers() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  if (removeTimer) { clearTimeout(removeTimer); removeTimer = null; }
 }

 function close() {
  clearTimers();
  const onClose = currentOnClose;
  currentOnClose = null;
  visible = false;
  setHelpOpen(false);
  removeTimer = setTimeout(() => {
   currentMessage = null;
   notificationMessage.set(null);
   if (onClose) onClose();
  }, 500);
 }

 $effect(() => {
  const msg = $notificationMessage;
  if (!msg) return;

  clearTimers();
  currentMessage = msg.html;
  showLookPhone = msg.showLookPhone ?? false;
  currentOnClose = msg.onClose ?? null;
  visible = false;

  // Paint the initial hidden state, then slide in
  requestAnimationFrame(() => { requestAnimationFrame(() => {
   visible = true;
   if (msg.showLookPhone) setHelpOpen(true);
  }); });

  if (msg.duration) {
   hideTimer = setTimeout(close, msg.duration);
  }
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
   <button
    class="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-2 z-10 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer"
    onclick={close}
   >
    <span class="text-2xl uppercase">ok</span>
   </button>
  </div>
 </div>
{/if}
