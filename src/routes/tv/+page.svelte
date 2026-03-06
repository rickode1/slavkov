<script>
 import { m } from "$lib/paraglide/messages.js";
 import { beforeNavigate, goto } from "$app/navigation";
 import { onMount } from "svelte";
 import { sessionId, deviceParam } from "$lib/stores/gameSession.js";
 import { notify } from "$lib/stores/notification.js";

 import LangSwitcher from "$components/LangSwitcher.svelte";
 import Logo from "$components/svg/Logo.svelte";
 import EmblemFr from "$components/svg/EmblemFr.svelte";
 import EmblemAt from "$components/svg/EmblemAt.svelte";
 import EmblemRu from "$components/svg/EmblemRu.svelte";
 import Button from "$components/Button.svelte";

 let sessionCreated = false;
 let currentSessionId = $state();
 let currentDevice = $state();
 let debug = $state(false);

 sessionId.subscribe((value) => {
  currentSessionId = value;
 });

 deviceParam.subscribe((value) => {
  currentDevice = value;
 });

 onMount(() => {
  if (window.location.hostname === 'localhost') {
   debug = true;
   notify('Debug on');
  }

  function handleKeydown(e) {
   if (e.key === 'd' || e.key === 'D') {
    debug = !debug;
    notify(`Debug ${debug ? 'on' : 'off'}`);
   }
  }
  window.addEventListener('keydown', handleKeydown);
  return () => window.removeEventListener('keydown', handleKeydown);
 });

 beforeNavigate(async ({ to, from, cancel }) => {
  if (
   to?.url.pathname.includes("/tv/1-lobby") &&
   !sessionCreated &&
   !currentSessionId
  ) {
   cancel();

   try {
    const body = {
     ...(currentDevice ? { device: currentDevice } : {}),
     ...(debug ? { debug: true } : {}),
    };
    const hasBody = Object.keys(body).length > 0;
    const response = await fetch("/api/session/create", {
     method: "POST",
     headers: hasBody ? { "Content-Type": "application/json" } : {},
     body: hasBody ? JSON.stringify(body) : undefined,
    });
    const { session, error } = await response.json();

    if (error) {
     console.error("Failed to create game session:", error);
     return;
    }

    sessionId.set(session.id);
    sessionCreated = true;
    goto(to.url.pathname);
   } catch (err) {
    console.error("Failed to create game session:", err);
   }
  }
 });
</script>

<Logo classes="max-w-xl -mr-8 mt-[14vh]" />

<EmblemFr classes="h-28 w-auto absolute top-10 left-8" />

<div class="absolute top-10 right-8 flex flex-col space-y-4">
 <EmblemAt classes="h-32 w-auto" />
 <EmblemRu classes="h-32 w-auto" />
</div>

<Button text={m.start()} href={"/tv/1-lobby"} classes="my-auto" />
