<script>
 import { onDestroy, onMount } from "svelte";
 import { goto } from "$app/navigation";
 import { page } from "$app/state";
 import { locales, setLocale } from "$lib/paraglide/runtime";
 import {
  sessionId,
  gameSession,
  resetSession,
 } from "$lib/stores/gameSession.js";
 import { subscribeToSession, cleanupSession } from "$lib/sessionRealtime.js";
 import { terminalStates, gameScreens } from "$lib/constants.js";

 let { children } = $props();

 onMount(() => {
  const lang = page.url.searchParams.get("lang");
  if (lang && locales.includes(lang)) {
   const url = new URL(window.location.href);
   url.searchParams.delete("lang");
   window.history.replaceState({}, "", url);
   setLocale(lang);
  }
 });

 $effect(() => {
  const id = $sessionId;
  if (id) {
   subscribeToSession(id);
  }
 });

 $effect(() => {
  const session = $gameSession;
  if (session && terminalStates.includes(session.status)) {
   cleanupSession();
   resetSession();
   goto("/");
  }
 });

 $effect(() => {
  const session = $gameSession;
  if (session && gameScreens[session.status]) {
   const targetPath = `/tv/${gameScreens[session.status]}`;
   if (!page.url.pathname.startsWith(targetPath)) {
    setTimeout(goto(targetPath), 2000);
   }
  }
 });

 onDestroy(cleanupSession);
</script>

{@render children()}
