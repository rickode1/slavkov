<script>
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import { gameSession } from "$lib/stores/gameSession.js";
 import Logo from "$components/svg/Logo.svelte";
 import PlayerLobby from "$components/PlayerLobby.svelte"; 
</script>

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

<div class="absolute left-5 top-54 w-40">
 <p class="text-center text-sm mb-2">{@html m.wifi()}</p>
 <img
  class="w-30 h-auto mx-auto"
  srcset={optimize("/img/wifi.png")}
  alt=""
 />
</div>
