<script>
 import { m } from "$lib/paraglide/messages.js";
 import {
  phoneSessionId,
  phoneSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import LangSwitcher from "$components/LangSwitcher.svelte";
 import Logo from "$components/svg/Logo.svelte";
 import Button from "$components/Button.svelte";

 let code = $state("");
 let error = $state("");

 async function joinSession() {
  error = "";

  if (code.length !== 4) {
   error = "Please enter a 4-digit code";
   return;
  }

  const response = await fetch("/api/session/join", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
   error = data.error || "Session not found";
   return;
  }

  playerCode.set(data.playerCode);
  phoneSessionId.set(data.session.id);
 }
</script>

<main
 class="container relative px-8 pt-[10vh] pb-10 min-h-screen mx-auto flex flex-col items-center"
>
 <Logo classes="max-w-60 mb-8" />

 {#if !$phoneSession}
  <div class="flex flex-col items-center gap-4 mt-8">
   <input
    type="text"
    inputmode="numeric"
    pattern="[0-9]*"
    maxlength="4"
    placeholder="Enter 4-digit code"
    bind:value={code}
    class="text-center text-4xl w-48 h-16 rounded-md border-2 border-secondary"
   />

   {#if error}
    <p class="text-primary">{error}</p>
   {/if}

   <Button text={m.join()} onclick={joinSession} />
  </div>
 {:else}
  <div class="text-center mt-8">
   <p class="text-2xl mb-4">
    Connected as Player {$playerCode === "code_1" ? "1" : "2"}
   </p>
   <p>Code 1: {$phoneSession.code_1}</p>
   <p>Code 2: {$phoneSession.code_2}</p>
   <p>Status: {$phoneSession.status}</p>
  </div>
 {/if}

 <LangSwitcher classes="mt-auto mx-auto" />
</main>
