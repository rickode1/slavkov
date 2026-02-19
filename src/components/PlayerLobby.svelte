<script>
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import Button from "$components/Button.svelte";
 import SuccessIcon from "$components/SuccessIcon.svelte";

 let { code = null, player = null, playerNumber } = $props();

 function isPlayerReady(player) {
  return player?.bust && player?.nick;
 }
</script>

<div class="flex flex-col items-center w-1/2">
 {#if !isPlayerReady(player)}
  <img
   class="h-50 w-auto lg:w-76 lg:h-auto"
   srcset={optimize("/img/bust.png")}
   alt=""
  />
 {:else}
  <img
   class="h-50 w-auto lg:w-76 lg:h-auto"
   srcset={optimize("/img/bust_" + player?.bust + ".png")}
   alt=""
  />
 {/if}

 {#if code}
  <p class="text-2xl text-center">{m.lobby_cta()}</p>
  <div class="flex gap-2 mt-8">
   {#each String(code).split("") as digit}
    <Button text={digit} classes="!min-w-14 !px-4" />
   {/each}
  </div>
 {:else if !isPlayerReady(player)}
  <p class="text-4xl text-center mt-4">{m.player()}&nbsp;{playerNumber}</p>
  <div class="flex flex-col items-center gap-3 mt-8">
   <SuccessIcon />
   <p class="text-2xl text-center">{m.connected()}</p>
  </div>
 {:else}
  <p class="text-4xl text-center mt-4">{player?.nick}</p>
  <div class="flex flex-col items-center gap-3 mt-8">
   <SuccessIcon />
   <p class="text-2xl text-center">{m.connected()}</p>
  </div>
 {/if}
</div>
