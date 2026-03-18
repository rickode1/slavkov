<script>
 import { onDestroy, onMount } from "svelte";
 import { goto } from "$app/navigation";
 import { page } from "$app/state";
 import { locales, setLocale } from "$lib/paraglide/runtime";
 import {
  sessionId,
  gameSession,
  resetSession,
  playerCode,
 } from '$lib/stores/gameSession.js';
 import { subscribeToSession, cleanupSession } from '$lib/sessionRealtime.js';
 import { terminalStates, gameScreens } from "$lib/constants.js";
 import { currentLocale } from "$lib/stores/locale.js";
 import LangSwitcher from "$components/LangSwitcher.svelte";
 import Timer from "$components/Timer.svelte";

 let { children } = $props();

 let wakeLock = null;

 async function requestWakeLock() {
  try {
   if ('wakeLock' in navigator) {
    wakeLock = await navigator.wakeLock.request('screen');
   }
  } catch (e) {
   console.warn('Wake lock failed:', e);
  }
 }

 onMount(() => {
  requestWakeLock();

  const savedId = localStorage.getItem('sessionId');
  const savedCode = localStorage.getItem('playerCode');
  if (savedId && savedCode && !$sessionId && !$gameSession?.debug) {
   playerCode.set(savedCode);
   sessionId.set(savedId);
  }
  const lang = page.url.searchParams.get("lang");
  if (lang && locales.includes(lang)) {
   const url = new URL(window.location.href);
   url.searchParams.delete("lang");
   window.history.replaceState({}, "", url);
   setLocale(lang, { reload: false });
   currentLocale.set(lang);
  }

  function handleKeydown(e) {
   if (e.key !== ".") return;
   const current = $sessionId ?? "(none)";
   const input = prompt(`Session ID: ${current}\n\nEnter new ID to reconnect:`);
   if (input && input.trim() && input.trim() !== $sessionId) {
    const newId = input.trim();
    if(!$gameSession?.debug) {
    localStorage.setItem('sessionId', newId);
    }
    sessionId.set(newId);
   }
  }
  window.addEventListener("keydown", handleKeydown);

  return () => {
   window.removeEventListener("keydown", handleKeydown);
   wakeLock?.release();
  };
 });

 $effect(() => {
  const id = $sessionId;
  if (id) {
   localStorage.setItem('sessionId', id);
   subscribeToSession(id);
  } else if (page.url.pathname !== "/phone/1-lobby") {
   goto("/phone/1-lobby");
  }
 });

 $effect(() => {
  const code = $playerCode;
  if (code) localStorage.setItem('playerCode', code);
 });

 $effect(() => {
  const session = $gameSession;
  if (session && terminalStates.includes(session.status)) {
   cleanupSession();
   resetSession();
   localStorage.removeItem('sessionId');
   localStorage.removeItem('playerCode');    
   goto("/phone/1-lobby");
  }
 });

 $effect(() => {
  const session = $gameSession;
  if (session && gameScreens.includes(session.status)) {
   const targetPath = `/phone/${session.status}`;
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
 });
</script>

<main
 class="container relative px-4 pt-4 pb-16 min-h-screen mx-auto flex flex-col items-center"
>
 {#key $currentLocale}
  {@render children()}
 {/key}
 <LangSwitcher classes="fixed left-4 bottom-4" />
 <Timer />
</main>
