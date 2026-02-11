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
 import ErrorIcon from "$components/ErrorIcon.svelte";

 let { children } = $props();

 async function handleCancel() {
  if (!confirm("Are you sure you want to cancel the game session?")) {
   return;
  }

  try {
   const response = await fetch("/api/session/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: $sessionId, status: "0-canceled" }),
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
  if (lang && locales.includes(lang)) {
   const url = new URL(window.location.href);
   url.searchParams.delete("lang");
   window.history.replaceState({}, "", url);
   setLocale(lang);
  }

  // Redirect to correct screen if URL doesn't match session status
  const session = $gameSession;
  if (session && gameScreens[session.status]) {
   const targetPath = `/tv/${gameScreens[session.status]}`;
   if (page.url.pathname !== targetPath && page.url.pathname !== "/tv") {
    goto(targetPath);
   }
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
   if (page.url.pathname !== targetPath) {
    goto(targetPath);
   }
  }
 });

 onDestroy(cleanupSession);
</script>

<main
 class="max-w-480 relative px-10 h-screen mx-auto flex flex-col items-center"
>
 {@render children()}
 <LangSwitcher
  classes={page.url.pathname === "/tv"
   ? "mt-auto mx-auto"
   : "absolute left-8 bottom-6"}
  showAll={page.url.pathname === "/tv"}
 />

 {#if $sessionId && page.url.pathname !== "/tv"}
  <button
   class="absolute right-8 bottom-6"
   onclick={handleCancel}
   aria-label="Cancel game session"
  >
   <ErrorIcon classes="w-14 lg:w-20 h-14 lg:h-20" />
  </button>
 {/if}
</main>
