<script>
 import { onDestroy, onMount } from "svelte";
 import { goto } from "$app/navigation";
 import { page } from "$app/state";
 import { locales, setLocale } from "$lib/paraglide/runtime";
 import {
  sessionId,
  gameSession,
  resetSession,
  deviceParam,
 } from "$lib/stores/gameSession.js";
 import { subscribeToSession, cleanupSession } from "$lib/sessionRealtime.js";
 import { terminalStates, gameScreens } from "$lib/constants.js";
 import { currentLocale } from "$lib/stores/locale.js";
 import { fly } from "svelte/transition";
 import * as m from "$lib/paraglide/messages.js";
 import LangSwitcher from "$components/LangSwitcher.svelte";
 import ErrorIcon from "$components/ErrorIcon.svelte";
 import Notification from "$components/Notification.svelte";

 let { children } = $props();

 let cancelExpanded = $state(false);
 let autoCloseTimer = $state(null);

 function toggleCancelPanel() {
  cancelExpanded = !cancelExpanded;
  clearAutoClose();
  if (cancelExpanded) {
   autoCloseTimer = setTimeout(() => {
    cancelExpanded = false;
    autoCloseTimer = null;
   }, 5000);
  }
 }

 function clearAutoClose() {
  if (autoCloseTimer) {
   clearTimeout(autoCloseTimer);
   autoCloseTimer = null;
  }
 }

 async function confirmCancel() {
  cancelExpanded = false;
  clearAutoClose();

  const isGameEnd = page.url.pathname.includes('8-gameend');
  const status = isGameEnd ? '0-finished' : '0-canceled';

  try {
   const response = await fetch("/api/session/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: $sessionId, status }),
   });

   if (!response.ok) {
    console.error("Failed to cancel session");
   }
  } catch (error) {
   console.error("Error canceling session:", error);
  }
 }

 onMount(() => {
  const lang = page.url.searchParams.get("lang");
  const device = page.url.searchParams.get("device");
  const url = new URL(window.location.href);
  let paramsChanged = false;

  if (lang && locales.includes(lang)) {
   url.searchParams.delete("lang");
   paramsChanged = true;
   setLocale(lang, { reload: false });
   currentLocale.set(lang);
  }

  if (device) {
   url.searchParams.delete("device");
   paramsChanged = true;
   deviceParam.set(device);
  }

  if (paramsChanged) {
   window.history.replaceState({}, "", url);
  }

  function handleKeydown(e) {
   if (e.key !== ".") return;
   const current = $sessionId ?? "(none)";
   const input = prompt(`Session ID: ${current}\n\nEnter new ID to reconnect:`);
   if (input && input.trim() && input.trim() !== $sessionId) {
    sessionId.set(input.trim());
   }
  }
  window.addEventListener("keydown", handleKeydown);
  return () => window.removeEventListener("keydown", handleKeydown);
 });

 $effect(() => {
  const id = $sessionId;
  if (id) {
   subscribeToSession(id);
  } else if (page.url.pathname !== "/tv") {
   goto("/tv");
  }
 });

 $effect(() => {
  const session = $gameSession;
  if (session && terminalStates.includes(session.status)) {
   cleanupSession();
   resetSession();
   goto("/tv");
  }
 });

 $effect(() => {
  const session = $gameSession;
  if (session && gameScreens.includes(session.status)) {
   const targetPath = `/tv/${session.status}`;
   if (page.url.pathname !== targetPath) {
    if (session.status === "2-onboarding") {
     setTimeout(() => goto(targetPath), 3000);
    } else {
     goto(targetPath);
    }
   }
  }
 });

 onDestroy(() => {
  cleanupSession();
  clearAutoClose();
 });
</script>

<main
 class="max-w-480 relative px-10 h-screen mx-auto flex flex-col items-center"
>
 <Notification />
 
 {#key $currentLocale}
  {@render children()}
 {/key}
 <LangSwitcher
  classes={page.url.pathname === "/tv"
   ? "mt-auto mx-auto mb-10"
   : "absolute left-8 bottom-6"}
  showAll={page.url.pathname === "/tv"}
 />

 {#if $sessionId && page.url.pathname !== "/tv"}
  <div class="absolute right-8 bottom-6 flex items-start">
   {#if cancelExpanded}
   <div class="flex flex-col items-end mr-6 gap-y-2">
    <span
     class="text-black text-xl whitespace-nowrap"
     transition:fly={{ x: 80, duration: 300 }}
    >
     {m.cancel_game()}
    </span>
    <button
     class="text-white bg-secondary rounded-lg text-sm lg:text-lg px-4 py-1 lg:py-2 cursor-pointer whitespace-nowrap"
     onclick={confirmCancel}
     transition:fly={{ x: 80, duration: 300, delay: 50 }}
    >
     {m.confirm()}
    </button>
   </div>
   {/if}
   <button
    class="relative z-10"
    onclick={toggleCancelPanel}
    aria-label="Cancel game session"
   >
    <ErrorIcon classes="w-14 lg:w-20 h-14 lg:h-20" />
   </button>
  </div>
 {/if}
</main>
