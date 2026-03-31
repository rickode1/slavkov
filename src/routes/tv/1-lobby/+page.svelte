<script>
 import { m } from "$lib/paraglide/messages.js";
 import { gameSession } from "$lib/stores/gameSession.js";
 import Logo from "$components/svg/Logo.svelte";
 import PlayerLobby from "$components/PlayerLobby.svelte"; 
</script>

<svelte:head>
  <link rel="preload" href="/img/wifi.webp" as="image" />
</svelte:head>

 <Logo classes="max-w-60 absolute top-10 left-8" />

 {#if $gameSession}
  <div class="flex w-full max-w-4xl justify-between gap-x-20 mt-[14vh]">
   <PlayerLobby
    code={$gameSession.code_1}
    player={$gameSession.player_1}
    playerNumber={1}
   />
   <PlayerLobby
    code={$gameSession.code_2}
    player={$gameSession.player_2}
    playerNumber={2}
   />
  </div>
 {/if}

<div class="absolute top-8 right-8 w-40">
 <p class="text-center text-sm mb-2">{@html m.wifi()}</p>
 <img
  class="w-30 h-auto mx-auto"
  src="/img/wifi.webp"
  alt=""
 />
</div>

<div class="absolute top-58 right-8 w-40">
 <p class="text-center text-sm mb-2">{@html m.ts()}</p>
 <img
  class="w-30 h-auto mx-auto"
  src="/img/ts.webp"
  alt=""
 />
</div>
