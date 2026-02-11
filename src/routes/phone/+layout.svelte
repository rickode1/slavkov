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
 import LangSwitcher from "$components/LangSwitcher.svelte";

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
  } else if (page.url.pathname !== "/phone/1-lobby") {
   goto("/phone/1-lobby");
  }
 });

 $effect(() => {
  const session = $gameSession;
  if (session && terminalStates.includes(session.status)) {
   cleanupSession();
   resetSession();
   goto("/phone/1-lobby");
  }
 });

 $effect(() => {
  const session = $gameSession;
  if (session && gameScreens[session.status]) {
   const targetPath = `/phone/${gameScreens[session.status]}`;
   if (page.url.pathname !== targetPath) {
    goto(targetPath);
   }
  }
 });

 onDestroy(cleanupSession);
</script>

<main
 class="container relative px-4 py-4 h-screen mx-auto flex flex-col items-center"
>
 {@render children()}
 <LangSwitcher classes="pt-8 mt-auto mr-auto" />
</main>
